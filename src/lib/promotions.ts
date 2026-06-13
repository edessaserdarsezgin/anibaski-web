import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { Promotion } from "@/lib/promotionsCalc";
import { isDateValid, cartPromoAmount } from "@/lib/promotionsCalc";

type Row = Record<string, unknown>;

function mapRow(r: Row, prodMap: Map<string, string[]>, catMap: Map<string, string[]>): Promotion {
  const id = r.id as string;
  return {
    id, name: r.name as string,
    trigger: r.trigger as "auto" | "code", applyLevel: r.apply_level as "item" | "cart",
    dealType: (r.deal_type as "flat" | "bogo") ?? "flat", code: (r.code as string) ?? null,
    scope: r.scope as Promotion["scope"], valueType: r.value_type as Promotion["valueType"],
    value: Number(r.value), minSubtotal: r.min_subtotal == null ? null : Number(r.min_subtotal),
    startsAt: (r.starts_at as string) ?? null, endsAt: (r.ends_at as string) ?? null,
    maxUses: r.max_uses == null ? null : Number(r.max_uses), usedCount: Number(r.used_count ?? 0),
    firstOrderOnly: !!r.first_order_only, priority: Number(r.priority ?? 0),
    productIds: prodMap.get(id) ?? [], categoryIds: catMap.get(id) ?? [],
    badgeColor: (r.badge_color as string) ?? null,
  };
}

// parentId → doğrudan çocuk kategori id'leri
async function loadCategoryChildren(db: ReturnType<typeof createAdminClient>): Promise<Map<string, string[]>> {
  const { data: cats } = await db.from("categories").select('id, "parentId"');
  const children = new Map<string, string[]>();
  for (const c of cats ?? []) {
    const pid = (c as { parentId?: string | null }).parentId;
    if (pid) { const a = children.get(pid) ?? []; a.push(c.id as string); children.set(pid, a); }
  }
  return children;
}

// Seçili kategori id'lerini tüm alt kategorileriyle genişlet (ana kategori → alt kategoriler de kapsanır)
function expandWithDescendants(catIds: string[], children: Map<string, string[]>): string[] {
  const out = new Set<string>(catIds);
  const stack = [...catIds];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const child of children.get(cur) ?? []) {
      if (!out.has(child)) { out.add(child); stack.push(child); }
    }
  }
  return [...out];
}

// Seçili kategori id'lerini alt kategorileriyle genişlet (dışarıdan kullanım için)
export async function expandCategoryIds(db: ReturnType<typeof createAdminClient>, ids: string[]): Promise<string[]> {
  if (!ids.length) return ids;
  return expandWithDescendants(ids, await loadCategoryChildren(db));
}

// Bir promotion kapsamındaki (ürün/kategori+alt/tüm) aktif ürün id'leri
export async function getScopeProductIds(
  db: ReturnType<typeof createAdminClient>,
  scope: "all" | "products" | "categories",
  productIds: string[],
  categoryIds: string[],
): Promise<string[]> {
  if (scope === "products") return productIds ?? [];
  if (scope === "categories") {
    const catIds = await expandCategoryIds(db, categoryIds ?? []);
    if (!catIds.length) return [];
    const { data } = await db.from("products").select("id").in("categoryId", catIds).eq("isActive", true);
    return (data ?? []).map((p) => p.id as string);
  }
  const { data } = await db.from("products").select("id").eq("isActive", true);
  return (data ?? []).map((p) => p.id as string);
}

// Etiketi ürünlere ata (idempotent — mevcut olan dokunulmaz, pozisyonu korunur)
export async function applyTagToProducts(
  db: ReturnType<typeof createAdminClient>, tagId: string, productIds: string[], position = "top-left",
): Promise<void> {
  if (!productIds.length) return;
  await db.from("product_tags")
    .upsert(productIds.map((pid) => ({ productId: pid, tagId, position })), { onConflict: "productId,tagId", ignoreDuplicates: true });
}

// Etiketi ürünlerden sök (etiket tanımı tags'te kalır)
export async function detachTagFromProducts(
  db: ReturnType<typeof createAdminClient>, tagId: string, productIds: string[],
): Promise<void> {
  if (!productIds.length) return;
  await db.from("product_tags").delete().eq("tagId", tagId).in("productId", productIds);
}

// Bir promosyonun güncel kapsam (üyelik + scope+alt kategori) ürün id'leri
export async function promotionScopeProductIds(
  db: ReturnType<typeof createAdminClient>, promotionId: string, scope: "all" | "products" | "categories",
): Promise<string[]> {
  const [{ data: pp }, { data: pc }] = await Promise.all([
    db.from("promotion_products").select("product_id").eq("promotion_id", promotionId),
    db.from("promotion_categories").select("category_id").eq("promotion_id", promotionId),
  ]);
  return getScopeProductIds(db, scope, (pp ?? []).map((x) => x.product_id), (pc ?? []).map((x) => x.category_id));
}

async function loadPromotions(filter: { applyLevel: "item" | "cart"; trigger?: "auto" | "code" }): Promise<Promotion[]> {
  const db = createAdminClient();
  let q = db.from("promotions").select("*").eq("is_active", true).eq("apply_level", filter.applyLevel).eq("deal_type", "flat");
  if (filter.trigger) q = q.eq("trigger", filter.trigger);
  const { data: rows } = await q;
  const ids = (rows ?? []).map((r) => r.id as string);
  const prodMap = new Map<string, string[]>();
  const catMap = new Map<string, string[]>();
  if (ids.length) {
    const [{ data: pp }, { data: pc }] = await Promise.all([
      db.from("promotion_products").select("promotion_id, product_id").in("promotion_id", ids),
      db.from("promotion_categories").select("promotion_id, category_id").in("promotion_id", ids),
    ]);
    for (const x of pp ?? []) { const a = prodMap.get(x.promotion_id) ?? []; a.push(x.product_id); prodMap.set(x.promotion_id, a); }
    for (const x of pc ?? []) { const a = catMap.get(x.promotion_id) ?? []; a.push(x.category_id); catMap.set(x.promotion_id, a); }
    // Kategori kapsamlarını alt kategorilerle genişlet (ana kategori seçilince alt ürünler de kapsanır)
    if (catMap.size > 0) {
      const children = await loadCategoryChildren(db);
      for (const [pid, cids] of catMap) catMap.set(pid, expandWithDescendants(cids, children));
    }
  }
  return (rows ?? []).map((r) => mapRow(r as Row, prodMap, catMap));
}

/** Katman A — aktif otomatik item indirimleri (kart + sipariş fiyatı). Cache tag: "promotions". */
export const getActiveItemPromotions = unstable_cache(
  () => loadPromotions({ applyLevel: "item", trigger: "auto" }),
  ["promotions-item"], { tags: ["promotions"] }
);

/** Katman B — aktif otomatik cart (sepet eşikli) indirimleri. Cache tag: "promotions". */
export const getActiveCartAutoPromotions = unstable_cache(
  () => loadPromotions({ applyLevel: "cart", trigger: "auto" }),
  ["promotions-cart-auto"], { tags: ["promotions"] }
);

/** Aktif kuponlar (kart rozeti için: ürün/kategori-kapsamlı olanlar filtrelenir). Cache tag: "promotions". */
export const getActiveCouponPromotions = unstable_cache(
  () => loadPromotions({ applyLevel: "cart", trigger: "code" }),
  ["promotions-coupons"], { tags: ["promotions"] }
);

/** İndirim çakışma modu: false = en iyisi (max), true = topla (stack). Cache tag: "promotions". */
export const getDiscountStacking = unstable_cache(
  async (): Promise<boolean> => {
    try {
      const db = createAdminClient();
      const { data } = await db.from("discount_settings").select("stacking").eq("id", 1).single();
      return !!data?.stacking;
    } catch { return false; }
  },
  ["discount-stacking"], { tags: ["promotions"] }
);

/**
 * Üyenin önceki GERÇEKLEŞMİŞ siparişi var mı? (ilk-sipariş kuponu)
 * Kart: paymentStatus=paid. COD: iptal/bekleyen değil, işleme alınmış statüler.
 * (İptal edilmiş COD siparişi ilk-sipariş hakkını yakmamalı.)
 */
export async function hasPriorOrder(userId: string): Promise<boolean> {
  const db = createAdminClient();
  const { count } = await db.from("orders").select("id", { count: "exact", head: true })
    .eq("userId", userId)
    .or("paymentStatus.eq.paid,and(paymentMethod.eq.cod,status.in.(PREPARING,SHIPPED,DELIVERED))");
  return (count ?? 0) > 0;
}

/**
 * Üyenin GERÇEKLEŞMİŞ siparişlerinde bu ürünlerden biri var mı? (üründe-ilk-sipariş kuponu)
 * productIds boşsa site geneli ilk-siparişe düşer.
 */
export async function hasPriorOrderForProducts(userId: string, productIds: string[]): Promise<boolean> {
  if (!productIds.length) return hasPriorOrder(userId);
  const db = createAdminClient();
  const { data: orders } = await db.from("orders").select("id")
    .eq("userId", userId)
    .or("paymentStatus.eq.paid,and(paymentMethod.eq.cod,status.in.(PREPARING,SHIPPED,DELIVERED))");
  const orderIds = (orders ?? []).map((o) => o.id as string);
  if (!orderIds.length) return false;
  const { count } = await db.from("order_items").select("id", { count: "exact", head: true })
    .in("orderId", orderIds).in("productId", productIds);
  return (count ?? 0) > 0;
}

export type CouponResult =
  | { ok: true; promo: Promotion; amount: number }
  | { ok: false; error: string };

/**
 * Kupon kodunu doğrula (kapsam-aware). items: Katman A SONRASI fiyatlı kalemler;
 * subtotal: indirimli ara toplam. Geçerliyse promotion + kısmi indirim tutarını döner.
 */
export async function validateCoupon(
  code: string,
  items: { productId: string; categoryId: string | null; unitPrice: number; quantity: number }[],
  subtotal: number,
  userId: string
): Promise<CouponResult> {
  const db = createAdminClient();
  const { data: rows } = await db.from("promotions").select("*")
    .eq("code", code.trim().toUpperCase()).eq("trigger", "code").eq("is_active", true).limit(1);
  const row = rows?.[0];
  if (!row) return { ok: false, error: "Geçersiz veya kullanılmış kupon kodu." };

  const [{ data: pp }, { data: pc }] = await Promise.all([
    db.from("promotion_products").select("product_id").eq("promotion_id", row.id),
    db.from("promotion_categories").select("category_id").eq("promotion_id", row.id),
  ]);
  const prodMap = new Map([[row.id as string, (pp ?? []).map((x) => x.product_id)]]);
  let catIds = (pc ?? []).map((x) => x.category_id);
  if (catIds.length) catIds = expandWithDescendants(catIds, await loadCategoryChildren(db));
  const catMap = new Map([[row.id as string, catIds]]);
  const promo = mapRow(row as Row, prodMap, catMap);

  if (!isDateValid(promo)) return { ok: false, error: "Bu kuponun süresi dolmuş." };
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return { ok: false, error: "Bu kupon kullanım limitine ulaşmış." };
  if (promo.minSubtotal && subtotal < promo.minSubtotal)
    return { ok: false, error: `Bu kupon için minimum sipariş tutarı ${promo.minSubtotal.toLocaleString("tr-TR")} ₺.` };
  if (promo.firstOrderOnly) {
    const scopeKind = (row.first_order_scope as string) ?? "site";
    if (scopeKind === "product") {
      const scopePids = await promotionScopeProductIds(db, row.id as string, promo.scope);
      if (await hasPriorOrderForProducts(userId, scopePids))
        return { ok: false, error: "Bu kupon yalnızca bu üründeki ilk siparişinizde geçerli." };
    } else if (await hasPriorOrder(userId)) {
      return { ok: false, error: "Bu kupon yalnızca ilk siparişte geçerli." };
    }
  }
  const amount = cartPromoAmount(promo, items);
  if (amount <= 0) return { ok: false, error: "Bu kupon sepetinizdeki ürünlerde geçerli değil." };
  return { ok: true, promo, amount };
}
