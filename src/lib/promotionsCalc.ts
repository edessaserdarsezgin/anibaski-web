// İndirim saf hesabı — sunucu bağımlılığı YOK (client'ten de import edilir).
export type Promotion = {
  id: string;
  name: string;
  trigger: "auto" | "code";
  applyLevel: "item" | "cart";
  dealType: "flat" | "bogo";
  code: string | null;
  scope: "all" | "products" | "categories";
  valueType: "percentage" | "fixed";
  value: number;
  minSubtotal: number | null;
  startsAt: string | null;
  endsAt: string | null;
  maxUses: number | null;
  usedCount: number;
  firstOrderOnly: boolean;
  priority: number;
  productIds: string[];      // scope='products'
  categoryIds: string[];     // scope='categories'
  badgeColor?: string | null; // kupon rozeti rengi (ürün kartı)
};

export type PricedItem = { productId: string; categoryId: string | null; unitPrice: number; quantity: number };

/** Promotion tarih penceresi şu an geçerli mi? */
export function isDateValid(p: Pick<Promotion, "startsAt" | "endsAt">, now = new Date()): boolean {
  if (p.startsAt && new Date(p.startsAt) > now) return false;
  if (p.endsAt && new Date(p.endsAt) < now) return false;
  return true;
}

/** Bir kalem promotion'ın kapsamına giriyor mu? */
export function itemInScope(p: Promotion, item: { productId: string; categoryId: string | null }): boolean {
  if (p.scope === "all") return true;
  if (p.scope === "products") return p.productIds.includes(item.productId);
  if (p.scope === "categories") return !!item.categoryId && p.categoryIds.includes(item.categoryId);
  return false;
}

/** Bir kaleme/satıra uygulanacak yüzde/sabit indirim tutarı. */
function flatAmountForLine(p: Promotion, lineTotal: number): number {
  return p.valueType === "percentage"
    ? Math.round(lineTotal * (p.value / 100) * 100) / 100
    : Math.min(p.value, lineTotal);
}

/**
 * Katman A — bir kaleme en iyi OTOMATIK item indirimi.
 * Öncelik: kapsam özgüllüğü (products > categories > all), eşitlikte en yüksek tutar, sonra priority.
 * Döner: indirimli birim fiyat + uygulanan promotion (yoksa null).
 */
export function bestItemDiscount(
  item: { productId: string; categoryId: string | null; unitPrice: number },
  itemPromos: Promotion[],
  now = new Date()
): { unitPrice: number; promo: Promotion | null } {
  const specificity = (p: Promotion) => (p.scope === "products" ? 3 : p.scope === "categories" ? 2 : 1);
  let best: Promotion | null = null;
  let bestAmt = 0;
  for (const p of itemPromos) {
    if (p.applyLevel !== "item" || p.trigger !== "auto" || p.dealType !== "flat") continue;
    if (!isDateValid(p, now) || !itemInScope(p, item)) continue;
    const amt = flatAmountForLine(p, item.unitPrice);
    if (amt <= 0) continue;
    if (!best || specificity(p) > specificity(best) ||
        (specificity(p) === specificity(best) && (amt > bestAmt || (amt === bestAmt && p.priority > best.priority)))) {
      best = p; bestAmt = amt;
    }
  }
  return { unitPrice: best ? Math.round((item.unitPrice - bestAmt) * 100) / 100 : item.unitPrice, promo: best };
}

/**
 * Katman B — bir cart promotion'ın (kupon veya eşik) indirim tutarı.
 * Kapsam-kısmi: yalnız eşleşen kalemlerin (Katman A sonrası) tutarına uygulanır.
 * Koşullar (min_subtotal, tarih) çağıran tarafından kontrol edilir; burada yalnız tutar.
 */
export function cartPromoAmount(p: Promotion, items: PricedItem[]): number {
  const matchedTotal = items
    .filter((it) => itemInScope(p, it))
    .reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  if (matchedTotal <= 0) return 0;
  return p.valueType === "percentage"
    ? Math.round(matchedTotal * (p.value / 100) * 100) / 100
    : Math.min(p.value, matchedTotal);
}

/**
 * Sonraki ulaşılabilir sepet-eşikli kademe (nudge için).
 * items verilirse YALNIZ sepette kapsam-içi ürünü olan promosyonlar dikkate alınır
 * (kapsam dışı ürünlerde "X TL daha ekle" mesajı çıkmasın).
 */
export function nextThreshold(
  subtotal: number,
  cartAutoPromos: Promotion[],
  items?: { productId: string; categoryId: string | null }[],
): Promotion | null {
  return cartAutoPromos
    .filter((p) => p.trigger === "auto" && p.minSubtotal != null && subtotal < p.minSubtotal
      && (!items || items.some((it) => itemInScope(p, it))))
    .sort((a, b) => (a.minSubtotal! - b.minSubtotal!))[0] ?? null;
}
