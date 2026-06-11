import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag } from "next/cache";

// Kademe düzenle / aktif-pasif değiştir
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const mapped: Record<string, unknown> = {};
  if ("isActive" in body) mapped.is_active = body.isActive;
  if ("minSubtotal" in body) mapped.min_subtotal = Number(body.minSubtotal);
  if ("discountType" in body) mapped.discount_type = body.discountType;
  if ("discountValue" in body) mapped.discount_value = Number(body.discountValue);

  const { error } = await admin.supabase.from("cart_discount_tiers").update(mapped).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag("cart-discount", "max");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { error } = await admin.supabase.from("cart_discount_tiers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag("cart-discount", "max");
  return NextResponse.json({ ok: true });
}
