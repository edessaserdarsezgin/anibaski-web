// src/lib/pricing.ts — ürün indirimi tek kaynağı.
export type DiscountFields = {
  discount_percent: number | null;
  discount_starts_at: string | null;
  discount_ends_at: string | null;
};

/** Aktif indirim yüzdesi; yoksa/aralık dışıysa 0. */
export function activeDiscountPercent(p: DiscountFields, now: Date = new Date()): number {
  const pct = p.discount_percent ?? 0;
  if (pct <= 0) return 0;
  if (p.discount_starts_at && new Date(p.discount_starts_at) > now) return 0;
  if (p.discount_ends_at && new Date(p.discount_ends_at) < now) return 0;
  return Math.min(100, pct);
}

/** İndirimli tutar (2 ondalık). percent<=0 → değişmez. */
export function applyDiscount(amount: number, percent: number): number {
  if (percent <= 0) return amount;
  return Math.round(amount * (1 - percent / 100) * 100) / 100;
}

/** Admin gövdesinden indirim alanlarını normalize eder (DB'ye yazılacak şekil). */
export function parseDiscountInput(body: {
  discount_percent?: unknown; discount_starts_at?: unknown; discount_ends_at?: unknown;
}): DiscountFields {
  const n = Number(body.discount_percent);
  const pct = Number.isFinite(n) && n > 0 ? Math.min(100, Math.round(n)) : null;
  const s = typeof body.discount_starts_at === "string" && body.discount_starts_at ? body.discount_starts_at : null;
  const e = typeof body.discount_ends_at === "string" && body.discount_ends_at ? body.discount_ends_at : null;
  return { discount_percent: pct, discount_starts_at: s, discount_ends_at: e };
}

/**
 * Kupon indirim değeri geçerli mi? Geçersizse hata mesajı, geçerliyse null.
 * Yüzde kupon < 100 olmalı: %100 + ücretsiz kargo → sipariş toplamı 0 olur,
 * PayTR 0 tutarı işleyemez ve ödenmemiş hayalet sipariş kalır. (Bedava/tekrar
 * baskı ileride ayrı admin akışıyla çözülecek — bkz. SORUNLAR.MD.)
 */
export function couponValueError(discountType: unknown, discountValue: unknown): string | null {
  const v = Number(discountValue);
  if (!Number.isFinite(v) || v <= 0) return "İndirim değeri 0'dan büyük olmalı.";
  if (discountType === "percentage" && v >= 100) {
    return "Yüzde kupon en fazla %99 olabilir (%100 sepeti tamamen sıfırlar).";
  }
  return null;
}

/** ISO → datetime-local input değeri (yerel). */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

/** datetime-local (yerel) → ISO; boş → null. */
export function localInputToIso(v: string | null | undefined): string | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
