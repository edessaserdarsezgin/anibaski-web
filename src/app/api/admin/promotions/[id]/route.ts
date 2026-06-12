import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const b = await req.json();
  const mapped: Record<string, unknown> = {};
  if ("isActive" in b) mapped.is_active = b.isActive;
  if ("name" in b) mapped.name = b.name?.trim();
  if ("scope" in b) mapped.scope = b.scope;
  if ("valueType" in b) mapped.value_type = b.valueType;
  if ("value" in b) mapped.value = Number(b.value);
  if ("minSubtotal" in b) mapped.min_subtotal = b.minSubtotal ? Number(b.minSubtotal) : null;
  if ("startsAt" in b) mapped.starts_at = b.startsAt || null;
  if ("endsAt" in b) mapped.ends_at = b.endsAt || null;
  if ("maxUses" in b) mapped.max_uses = b.maxUses ? Number(b.maxUses) : null;
  if ("firstOrderOnly" in b) mapped.first_order_only = !!b.firstOrderOnly;
  if ("priority" in b) mapped.priority = Number(b.priority) || 0;
  if ("code" in b) mapped.code = b.code ? b.code.trim().toUpperCase() : null;

  if (Object.keys(mapped).length) {
    const { error } = await admin.supabase.from("promotions").update(mapped).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Kapsam hedefleri verildiyse sil-yeniden yaz
  if ("productIds" in b) {
    await admin.supabase.from("promotion_products").delete().eq("promotion_id", id);
    if (Array.isArray(b.productIds) && b.productIds.length)
      await admin.supabase.from("promotion_products").insert(b.productIds.map((pid: string) => ({ promotion_id: id, product_id: pid })));
  }
  if ("categoryIds" in b) {
    await admin.supabase.from("promotion_categories").delete().eq("promotion_id", id);
    if (Array.isArray(b.categoryIds) && b.categoryIds.length)
      await admin.supabase.from("promotion_categories").insert(b.categoryIds.map((cid: string) => ({ promotion_id: id, category_id: cid })));
  }

  revalidateTag("promotions", "max");
  revalidateTag("products", "max");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Bağlı kampanya/duyuru bandını SİLME — pasife al (istatistik korunur, dangling referans kalmaz)
  const { data: row } = await admin.supabase.from("promotions").select("code").eq("id", id).single();
  const code = (row?.code as string | null) ?? null;
  await admin.supabase.from("campaigns").update({ is_active: false }).eq("promotion_id", id);
  if (code) {
    await admin.supabase.from("campaigns").update({ is_active: false }).eq("coupon_code", code);
    const { data: banns } = await admin.supabase.from("banners").select("id, text");
    const ids = (banns ?? []).filter((b) => b.text?.toUpperCase().includes(code.toUpperCase())).map((b) => b.id);
    if (ids.length) await admin.supabase.from("banners").update({ isActive: false }).in("id", ids);
  }

  const { error } = await admin.supabase.from("promotions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag("promotions", "max");
  revalidateTag("products", "max");
  return NextResponse.json({ ok: true });
}
