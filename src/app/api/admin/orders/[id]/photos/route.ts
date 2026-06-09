import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
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

  const result = (items ?? [])
    .filter(item => item.uploadedImages?.length > 0)
    .map(item => ({
      productName: (item.product as unknown as { name: string } | null)?.name ?? "Ürün",
      photos: item.uploadedImages as string[],
    }));

  return NextResponse.json({ orderId: id, items: result });
}
