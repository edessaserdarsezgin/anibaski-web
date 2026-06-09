import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  // JS'den gelen camelCase'i snake_case'e çevir
  const mapped: Record<string, unknown> = {};
  if ("isActive" in body) mapped.is_active = body.isActive;
  if ("discountType" in body) mapped.discount_type = body.discountType;
  if ("discountValue" in body) mapped.discount_value = body.discountValue;
  if ("minOrderAmount" in body) mapped.min_order_amount = body.minOrderAmount;
  if ("maxUses" in body) mapped.max_uses = body.maxUses;
  if ("expiresAt" in body) mapped.expires_at = body.expiresAt;

  const { data, error } = await admin.supabase
    .from("coupons")
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { error } = await admin.supabase.from("coupons").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
