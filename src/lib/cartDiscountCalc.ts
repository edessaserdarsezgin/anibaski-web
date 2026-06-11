// Sepet eşikli indirim — SAF hesaplama (sunucu bağımlılığı yok, client'ten de import edilir).
export type CartTier = {
  id: string;
  minSubtotal: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  isActive: boolean;
};

/** Bir kademe için indirim tutarı (ara toplam üzerinden). */
export function tierDiscount(subtotal: number, tier: CartTier): number {
  if (subtotal < tier.minSubtotal) return 0;
  return tier.discountType === "percentage"
    ? Math.round(subtotal * (tier.discountValue / 100) * 100) / 100
    : Math.min(tier.discountValue, subtotal);
}

/** Ara toplam için en yüksek indirim tutarını veren uygun kademe. Yoksa amount=0. */
export function bestCartDiscount(
  subtotal: number,
  tiers: CartTier[]
): { amount: number; tier: CartTier | null } {
  let best: { amount: number; tier: CartTier | null } = { amount: 0, tier: null };
  for (const t of tiers) {
    const amt = tierDiscount(subtotal, t);
    if (amt > best.amount) best = { amount: amt, tier: t };
  }
  return best;
}

/** Sonraki ulaşılabilir kademe (nudge için): henüz nitelik kazanılmamış en yakın kademe. */
export function nextTier(subtotal: number, tiers: CartTier[]): CartTier | null {
  const upcoming = tiers
    .filter((t) => subtotal < t.minSubtotal)
    .sort((a, b) => a.minSubtotal - b.minSubtotal);
  return upcoming[0] ?? null;
}
