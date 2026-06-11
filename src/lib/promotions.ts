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
  };
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

/** Üyenin önceki tamamlanmış (paid/cod) siparişi var mı? (ilk-sipariş kuponu) */
export async function hasPriorOrder(userId: string): Promise<boolean> {
  const db = createAdminClient();
  const { count } = await db.from("orders").select("id", { count: "exact", head: true })
    .eq("userId", userId).or("paymentStatus.eq.paid,paymentMethod.eq.cod");
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
  const catMap = new Map([[row.id as string, (pc ?? []).map((x) => x.category_id)]]);
  const promo = mapRow(row as Row, prodMap, catMap);

  if (!isDateValid(promo)) return { ok: false, error: "Bu kuponun süresi dolmuş." };
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return { ok: false, error: "Bu kupon kullanım limitine ulaşmış." };
  if (promo.minSubtotal && subtotal < promo.minSubtotal)
    return { ok: false, error: `Bu kupon için minimum sipariş tutarı ${promo.minSubtotal.toLocaleString("tr-TR")} ₺.` };
  if (promo.firstOrderOnly && await hasPriorOrder(userId)) return { ok: false, error: "Bu kupon yalnızca ilk siparişte geçerli." };
  const amount = cartPromoAmount(promo, items);
  if (amount <= 0) return { ok: false, error: "Bu kupon sepetinizdeki ürünlerde geçerli değil." };
  return { ok: true, promo, amount };
}
