import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAbandonedCartEmail } from "@/lib/email/abandonedCart";
import { notifyAbandonedCart } from "@/lib/whatsapp/notify";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const REMINDER_COUPON = "SEPET10";

type SnapshotItem = {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
};

type Snapshot = {
  id: string;
  user_id: string;
  items: SnapshotItem[];
  subtotal: number;
  item_count: number;
  first_reminder_sent_at: string | null;
  updated_at: string;
};

/**
 * Terk edilmiş sepet bildirim cron'u.
 * n8n her 5 dakikada bir çağırır: GET /api/internal/abandoned-cart
 * INTERNAL_CRON_SECRET header'ı ile yetkilendirilir.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.INTERNAL_CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "INTERNAL_CRON_SECRET set edilmemiş" }, { status: 500 });
  }
  const auth = req.headers.get("x-cron-secret");
  if (auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const now = Date.now();
  const FIRST_DELAY_MS = 30 * 60 * 1000;          // 30 dk
  const SECOND_DELAY_MS = 3 * 24 * 60 * 60 * 1000; // 3 gün
  const STALE_MS = 7 * 24 * 60 * 60 * 1000;       // 7 gün → temizlik

  // Stale snapshot'ları temizle
  await adminClient
    .from("abandoned_cart_snapshots")
    .delete()
    .lt("updated_at", new Date(now - STALE_MS).toISOString());

  // İlk hatırlatma (30 dk sonra, henüz gönderilmemiş)
  const firstCutoff = new Date(now - FIRST_DELAY_MS).toISOString();
  const { data: firstBatch } = await adminClient
    .from("abandoned_cart_snapshots")
    .select("*")
    .is("first_reminder_sent_at", null)
    .lt("updated_at", firstCutoff)
    .limit(50);

  // İkinci hatırlatma (ilk hatırlatmadan 3 gün sonra)
  const secondCutoff = new Date(now - SECOND_DELAY_MS).toISOString();
  const { data: secondBatch } = await adminClient
    .from("abandoned_cart_snapshots")
    .select("*")
    .not("first_reminder_sent_at", "is", null)
    .is("second_reminder_sent_at", null)
    .lt("first_reminder_sent_at", secondCutoff)
    .limit(50);

  const results: { user_id: string; stage: "first" | "second"; ok: boolean }[] = [];

  for (const snap of (firstBatch ?? []) as Snapshot[]) {
    const ok = await sendReminder(adminClient, snap, "first");
    results.push({ user_id: snap.user_id, stage: "first", ok });
  }
  for (const snap of (secondBatch ?? []) as Snapshot[]) {
    const ok = await sendReminder(adminClient, snap, "second");
    results.push({ user_id: snap.user_id, stage: "second", ok });
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}

async function sendReminder(
  adminClient: ReturnType<typeof createAdminClient>,
  snap: Snapshot,
  stage: "first" | "second"
): Promise<boolean> {
  const { data: profile } = await adminClient
    .from("profiles")
    .select("email, phone, fullName, marketing_consent")
    .eq("id", snap.user_id)
    .single();

  if (!profile || !profile.marketing_consent) {
    // Marketing izni yoksa snapshot'ı temizle (bir daha denemeyelim)
    await adminClient.from("abandoned_cart_snapshots").delete().eq("id", snap.id);
    return false;
  }

  const cartUrl = `${SITE_URL}/sepet`;
  const couponCode = REMINDER_COUPON;

  // E-posta gönder
  if (profile.email) {
    await sendAbandonedCartEmail({
      to: profile.email,
      customerName: profile.fullName,
      items: snap.items,
      subtotal: Number(snap.subtotal),
      cartUrl,
      couponCode,
      stage,
    }).catch((err) => console.error("[abandoned email]", err));
  }

  // WhatsApp gönder
  if (profile.phone) {
    notifyAbandonedCart({
      phone: profile.phone,
      itemCount: snap.item_count,
      subtotal: Number(snap.subtotal),
      cartUrl,
      couponCode,
      stage,
    });
  }

  // Zaman damgasını güncelle
  const field = stage === "first" ? "first_reminder_sent_at" : "second_reminder_sent_at";
  await adminClient
    .from("abandoned_cart_snapshots")
    .update({ [field]: new Date().toISOString() })
    .eq("id", snap.id);

  return true;
}
