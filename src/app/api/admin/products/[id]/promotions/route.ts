import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag } from "next/cache";

// Ürün-kapsamlı (scope='products') indirimler + bu ürünün üyelikleri.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const [{ data: promos }, { data: memberships }] = await Promise.all([
    admin.supabase.from("promotions").select("id, name, trigger, apply_level, code, value_type, value, is_active")
      .eq("scope", "products").order("created_at", { ascending: false }),
    admin.supabase.from("promotion_products").select("promotion_id").eq("product_id", id),
  ]);
  const selectedIds = (memberships ?? []).map((m) => m.promotion_id);
  return NextResponse.json({ available: promos ?? [], selectedIds });
}

// Bu ürünün ürün-kapsamlı indirim üyeliklerini ayarla.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { promotionIds } = (await req.json()) as { promotionIds?: string[] };
  const wanted = Array.isArray(promotionIds) ? promotionIds : [];

  // Yalnız scope='products' promotion'lar arasında üyeliği güncelle
  const { data: prodScoped } = await admin.supabase.from("promotions").select("id").eq("scope", "products");
  const scopedIds = (prodScoped ?? []).map((p) => p.id);

  if (scopedIds.length) {
    await admin.supabase.from("promotion_products").delete().eq("product_id", id).in("promotion_id", scopedIds);
  }
  const toInsert = wanted.filter((pid) => scopedIds.includes(pid));
  if (toInsert.length) {
    await admin.supabase.from("promotion_products").insert(toInsert.map((pid) => ({ promotion_id: pid, product_id: id })));
  }

  // Etiket senkronu: ürün-kapsamlı promosyonların etiketlerini bu ürünün güncel üyeliğine göre ayarla
  // (aktif + üye olunan promosyon etiketi gelir; üyelikten/aktiflikten çıkanın etiketi sökülür)
  const { data: scopedPromos } = await admin.supabase
    .from("promotions").select("id, tag_id, is_active").eq("scope", "products");
  const managed = (scopedPromos ?? []).filter((p) => p.tag_id);
  if (managed.length) {
    const memSet = new Set(toInsert);
    const desired = new Set(managed.filter((p) => p.is_active && memSet.has(p.id)).map((p) => p.tag_id as string));
    const managedTags = [...new Set(managed.map((p) => p.tag_id as string))];
    const toRemove = managedTags.filter((t) => !desired.has(t));
    if (desired.size)
      await admin.supabase.from("product_tags").upsert(
        [...desired].map((tagId) => ({ productId: id, tagId, position: "top-left" })),
        { onConflict: "productId,tagId", ignoreDuplicates: true });
    if (toRemove.length)
      await admin.supabase.from("product_tags").delete().eq("productId", id).in("tagId", toRemove);
    revalidateTag("tags", "max");
  }

  revalidateTag("promotions", "max");
  revalidateTag("products", "max");
  return NextResponse.json({ ok: true });
}
