import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { signUploadedImages } from "@/lib/uploads";
import { deleteFromR2 } from "@/lib/r2";
// Siparişe ait tüm fotoğraf URL'lerini JSON olarak döner
// Admin bu URL'leri kullanarak fotoğrafları indirebilir
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const { data: items, error } = await admin.supabase
    .from("order_items")
    .select("id, uploadedImages, product:products(name)")
    .eq("orderId", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = await Promise.all(
    (items ?? [])
      .filter(item => item.uploadedImages?.length > 0)
      .map(async item => ({
        productName: (item.product as unknown as { name: string } | null)?.name ?? "Ürün",
        photos: await signUploadedImages(item.uploadedImages as string[]),
      }))
  );

  return NextResponse.json({ orderId: id, items: result });
}

// Siparişin müşteri fotoğraflarını R2'den anında siler + photosPurgedAt işaretler.
// Durumdan bağımsız (iptal/terk edilen siparişler + acil KVKK/depolama talebi).
// http:/data: ile başlayan değerler (stüdyo çıktısı / tam URL) uploads'ta değil → atlanır.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const { data: items, error } = await admin.supabase
    .from("order_items")
    .select("uploadedImages")
    .eq("orderId", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const paths = Array.from(
    new Set(
      (items ?? [])
        .flatMap((it) => (it.uploadedImages as string[] | null) ?? [])
        .filter((v) => v && !/^(https?:|data:)/i.test(v))
    )
  );

  if (paths.length > 0) {
    try {
      await deleteFromR2(paths);
    } catch (e) {
      console.error(`[manuel-foto-sil] R2 sil hatası (order ${id}):`, e);
      return NextResponse.json({ error: "Fotoğraflar silinemedi" }, { status: 500 });
    }
  }

  const { error: updErr } = await admin.supabase
    .from("orders")
    .update({ photosPurgedAt: new Date().toISOString() })
    .eq("id", id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, deletedFiles: paths.length });
}
