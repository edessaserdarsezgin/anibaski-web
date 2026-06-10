import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const RETENTION_DAYS = 30;          // teslim + 30 gün → müşteri fotoğrafları silinir
const BATCH = 100;                  // tek çalışmada en fazla N sipariş

type OrderRow = {
  id: string;
  items: { uploadedImages: string[] | null }[] | null;
};

/**
 * Fotoğraf retention cron'u.
 * n8n günde 1× çağırır: GET /api/internal/photo-retention
 * INTERNAL_CRON_SECRET → x-cron-secret header'ı ile yetkilendirilir.
 *
 * DELIVERED + 30 günü geçmiş, henüz temizlenmemiş siparişlerin müşteri
 * fotoğraflarını uploads bucket'tan siler, photosPurgedAt işaretler.
 * uploadedImages stabil path tutar; http/data ile başlayanlar (stüdyo çıktısı,
 * eski tam URL) uploads'ta olmadığı için atlanır.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.INTERNAL_CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "INTERNAL_CRON_SECRET set edilmemiş" }, { status: 500 });
  }
  if (req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: orders, error } = await adminClient
    .from("orders")
    .select("id, items:order_items(uploadedImages)")
    .eq("status", "DELIVERED")
    .lt("deliveredAt", cutoff)
    .is("photosPurgedAt", null)
    .limit(BATCH);

  if (error) {
    console.error("[photo-retention] sorgu hatası:", error);
    return NextResponse.json({ error: "Sorgu başarısız" }, { status: 500 });
  }

  let purgedOrders = 0;
  let deletedFiles = 0;

  for (const order of (orders ?? []) as OrderRow[]) {
    // Tüm kalemlerin path'lerini topla; http/data passthrough değerlerini ele
    const paths = Array.from(
      new Set(
        (order.items ?? [])
          .flatMap((it) => it.uploadedImages ?? [])
          .filter((v) => v && !/^(https?:|data:)/i.test(v))
      )
    );

    if (paths.length > 0) {
      const { error: rmErr } = await adminClient.storage.from("uploads").remove(paths);
      if (rmErr) {
        // Silme başarısızsa işaretleme → ertesi gün tekrar denenir
        console.error(`[photo-retention] storage remove hatası (order ${order.id}):`, rmErr);
        continue;
      }
      deletedFiles += paths.length;
    }

    const { error: updErr } = await adminClient
      .from("orders")
      .update({ photosPurgedAt: new Date().toISOString() })
      .eq("id", order.id);
    if (updErr) {
      console.error(`[photo-retention] işaretleme hatası (order ${order.id}):`, updErr);
      continue;
    }
    purgedOrders++;
  }

  return NextResponse.json({ ok: true, purgedOrders, deletedFiles });
}
