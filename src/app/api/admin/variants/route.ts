import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json([]);

  const { data, error } = await admin.supabase
    .from("product_variants")
    .select("id, type, label, value, priceAddon")
    .eq("productId", productId)
    .order("type");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { productId, type, label, value, priceAddon } = await req.json();

  const { data, error } = await admin.supabase
    .from("product_variants")
    .insert({ productId, type, label, value, priceAddon: priceAddon ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag("products", "max"); // varyant değişti → ürün detay cache invalidate
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();

  const { error } = await admin.supabase.from("product_variants").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag("products", "max"); // varyant silindi → ürün detay cache invalidate
  return NextResponse.json({ ok: true });
}
