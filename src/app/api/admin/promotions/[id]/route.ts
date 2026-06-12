import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { getScopeProductIds, applyTagToProducts, detachTagFromProducts } from "@/lib/promotions";

type Scope = "all" | "products" | "categories";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const b = await req.json();

  // Etiket reconcile için eski durumu mutasyondan ÖNCE yakala
  const tagIntent = b.createTag || "tagId" in b;
  const activeIntent = "isActive" in b;
  let oldTagId: string | null = null;
  let oldScopeIds: string[] = [];
  let wasActive: boolean | null = null;
  if (tagIntent || activeIntent) {
    const { data: before } = await admin.supabase.from("promotions").select("tag_id, scope, is_active").eq("id", id).single();
    oldTagId = (before?.tag_id as string | null) ?? null;
    wasActive = (before?.is_active as boolean | null) ?? null;
    if (oldTagId) {
      const [{ data: oPP }, { data: oPC }] = await Promise.all([
        admin.supabase.from("promotion_products").select("product_id").eq("promotion_id", id),
        admin.supabase.from("promotion_categories").select("category_id").eq("promotion_id", id),
      ]);
      oldScopeIds = await getScopeProductIds(admin.supabase, (before?.scope ?? "all") as Scope,
        (oPP ?? []).map((x) => x.product_id), (oPC ?? []).map((x) => x.category_id));
    }
  }

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

  // Pasif indirimin etiketi üründe durmaz: etiket yalnız indirim aktifken ürünlere uygulanır
  const effectiveActive = activeIntent ? !!b.isActive : (wasActive ?? true);

  // Etiket reconcile: eski etiketi eski kapsamdan sök, yeni etiketi (varsa, aktifse) güncel kapsama uygula
  if (tagIntent) {
    let newTagId: string | null = null;
    if (b.createTag) {
      const label = b.tagLabel?.trim() || (b.valueType === "percentage" ? `%${b.value} İndirim` : b.value ? `${b.value}₺ İndirim` : "İndirim");
      const { data: tag } = await admin.supabase.from("tags").insert({ name: label, color: b.tagColor || "#e07a5f" }).select("id").single();
      newTagId = tag?.id ?? null;
    } else if (b.tagId) {
      newTagId = b.tagId;
    }
    if (oldTagId) await detachTagFromProducts(admin.supabase, oldTagId, oldScopeIds);
    await admin.supabase.from("promotions").update({ tag_id: newTagId }).eq("id", id);
    if (newTagId && effectiveActive) {
      const { data: after } = await admin.supabase.from("promotions").select("scope").eq("id", id).single();
      const [{ data: nPP }, { data: nPC }] = await Promise.all([
        admin.supabase.from("promotion_products").select("product_id").eq("promotion_id", id),
        admin.supabase.from("promotion_categories").select("category_id").eq("promotion_id", id),
      ]);
      const newPids = await getScopeProductIds(admin.supabase, (after?.scope ?? "all") as Scope,
        (nPP ?? []).map((x) => x.product_id), (nPC ?? []).map((x) => x.category_id));
      await applyTagToProducts(admin.supabase, newTagId, newPids);
    }
    revalidateTag("tags", "max");
  }

  // Aktif/pasif geçişinde etiketi senkronla (toggle yalnız isActive gönderir): pasifleşince sök, aktifleşince geri uygula
  if (activeIntent && !tagIntent && oldTagId && wasActive !== effectiveActive) {
    if (effectiveActive) await applyTagToProducts(admin.supabase, oldTagId, oldScopeIds);
    else await detachTagFromProducts(admin.supabase, oldTagId, oldScopeIds);
    revalidateTag("tags", "max");
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
  const { data: row } = await admin.supabase.from("promotions").select("code, tag_id, scope").eq("id", id).single();
  const code = (row?.code as string | null) ?? null;

  // Bağlı etiketi kapsamdaki ürünlerden sök (etiket tanımı /admin/etiketler'de kalır)
  const tagId = (row?.tag_id as string | null) ?? null;
  if (tagId) {
    const [{ data: dPP }, { data: dPC }] = await Promise.all([
      admin.supabase.from("promotion_products").select("product_id").eq("promotion_id", id),
      admin.supabase.from("promotion_categories").select("category_id").eq("promotion_id", id),
    ]);
    const pids = await getScopeProductIds(admin.supabase, (row?.scope ?? "all") as Scope,
      (dPP ?? []).map((x) => x.product_id), (dPC ?? []).map((x) => x.category_id));
    await detachTagFromProducts(admin.supabase, tagId, pids);
    revalidateTag("tags", "max");
  }
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
