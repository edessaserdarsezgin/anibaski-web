import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { promotionScopeProductIds, applyTagToProducts, detachTagFromProducts } from "@/lib/promotions";

type Scope = "all" | "products" | "categories";

// Kupon koduna bağlı kampanya + duyuru bandını indirimin aktifliğiyle senkronla.
// İndirim pasife alınınca onları reklam eden band/kampanya da pasifleşir, geri aktifleşince geri açılır.
async function syncLinkedCampaignsBanners(db: ReturnType<typeof createAdminClient>, code: string, active: boolean) {
  await db.from("campaigns").update({ is_active: active }).eq("coupon_code", code);
  const { data: banns } = await db.from("banners").select("id, text");
  const ids = (banns ?? []).filter((bn) => bn.text?.toUpperCase().includes(code.toUpperCase())).map((bn) => bn.id);
  if (ids.length) await db.from("banners").update({ isActive: active }).in("id", ids);
  revalidateTag("campaigns", "max");
}

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
  let oldCode: string | null = null;
  if (tagIntent || activeIntent) {
    const { data: before } = await admin.supabase.from("promotions").select("tag_id, scope, is_active, code").eq("id", id).single();
    oldTagId = (before?.tag_id as string | null) ?? null;
    wasActive = (before?.is_active as boolean | null) ?? null;
    oldCode = (before?.code as string | null) ?? null;
    if (oldTagId)
      oldScopeIds = await promotionScopeProductIds(admin.supabase, id, (before?.scope ?? "all") as Scope);
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
      const newPids = await promotionScopeProductIds(admin.supabase, id, (after?.scope ?? "all") as Scope);
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

  // Aktif/pasif geçişinde bağlı kampanya/duyuru bandını da senkronla (çift yönlü)
  if (activeIntent && wasActive !== effectiveActive && oldCode)
    await syncLinkedCampaignsBanners(admin.supabase, oldCode, effectiveActive);

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
    const pids = await promotionScopeProductIds(admin.supabase, id, (row?.scope ?? "all") as Scope);
    await detachTagFromProducts(admin.supabase, tagId, pids);
    revalidateTag("tags", "max");
  }
  if (code) await syncLinkedCampaignsBanners(admin.supabase, code, false);

  const { error } = await admin.supabase.from("promotions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag("promotions", "max");
  revalidateTag("products", "max");
  return NextResponse.json({ ok: true });
}
