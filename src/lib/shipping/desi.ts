// src/lib/shipping/desi.ts — desi hesabının tek kaynağı. Saf fonksiyonlar, DB/ağ bağımlılığı YOK.
//
// Desi, taşıyıcının ücretlendirdiği hacimsel ağırlıktır. İki kural:
//   1) Hacimsel desi = (En × Boy × Yükseklik) / 3000   [cm]
//   2) Faturalanan   = hacimsel desi ile kg'ın BÜYÜĞÜ  [yurt içi karayolu: 1 desi = 1 kg]
//
// ⚠️ Ölçüler ürünün değil, PAKETLENMİŞ hâlinin ölçüsüdür (ambalaj + koruyucu dahil).
// Büyük format baskıda maliyet ağırlıktan değil boyuttan gelir: 50×70×5 cm kanvas,
// ince ve hafif olmasına rağmen ≈5,8 desi eder. Bkz. KARGO_ARASTIRMA.md §6.

/** Yurt içi karayolu desi böleni. Taşıyıcılar arasında standart. */
export const DESI_DIVISOR = 3000;

/**
 * Çok kalemli siparişte kalem desilerinin toplamına eklenen sabit ambalaj payı.
 * Kalemler tek koliye girdiğinde koli desisi ≠ kalem desileri toplamı; bu pay
 * dış koli + dolgu malzemesini temsil eder. Kutu-optimizasyonu (bin packing)
 * bilinçli olarak yapılmıyor — ilk sürüm için aşırı mühendislik olur.
 */
export const PACKAGING_DESI_MARGIN = 0.5;

/** Paketlenmiş ürün ölçüleri. Uzunluk cm, ağırlık kg. */
export type PackageDimensions = {
  length: number;  // en (cm)
  width: number;   // boy (cm)
  height: number;  // yükseklik (cm)
  weight: number;  // ağırlık (kg)
};

/** DB'den gelen ham ürün satırı — alanlar dolmamış olabilir. */
export type ProductDimensionFields = {
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  weight_kg: number | null;
};

/** 2 ondalığa yuvarlar (para hesaplarındaki `pricing.ts` deseniyle aynı). */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Ürün satırındaki ölçüler eksiksiz mi? Biri bile boş/0 ise desi hesaplanamaz.
 * Admin uyarısı ve kargo akışının ön kontrolü bunu kullanır.
 */
export function hasDimensions(p: ProductDimensionFields): boolean {
  return [p.length_cm, p.width_cm, p.height_cm, p.weight_kg]
    .every(v => typeof v === "number" && Number.isFinite(v) && v > 0);
}

/** Ham ürün satırını ölçü nesnesine çevirir; eksikse null. */
export function toDimensions(p: ProductDimensionFields): PackageDimensions | null {
  if (!hasDimensions(p)) return null;
  return {
    length: p.length_cm as number,
    width: p.width_cm as number,
    height: p.height_cm as number,
    weight: p.weight_kg as number,
  };
}

/**
 * Admin gövdesinden ölçü alanlarını normalize eder (DB'ye yazılacak şekil).
 * `pricing.ts`'teki `parseDiscountInput` ile aynı desen — 0/negatif/boş → null.
 */
export function parseDimensionsInput(body: Record<string, unknown>): ProductDimensionFields {
  const num = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  return {
    length_cm: num(body.length_cm),
    width_cm: num(body.width_cm),
    height_cm: num(body.height_cm),
    weight_kg: num(body.weight_kg),
  };
}

/** Hacimsel desi: (En × Boy × Yükseklik) / 3000. */
export function volumetricDesi(d: PackageDimensions): number {
  return round2((d.length * d.width * d.height) / DESI_DIVISOR);
}

/** Faturalanan desi: hacimsel desi ile ağırlığın büyüğü. */
export function billableDesi(d: PackageDimensions): number {
  return round2(Math.max(volumetricDesi(d), d.weight));
}

/**
 * Taşıyıcı tarifesine uygulanacak desi. Tarifeler tam desi bandında olduğundan
 * yukarı yuvarlanır; en az 1 desi. (Fiyat sorgusuna ondalık gönderilecekse
 * `billableDesi` kullanılmalı — Aras `GetPriceCalculation` decimal kabul ediyor.)
 */
export function tariffDesi(d: PackageDimensions): number {
  return Math.max(1, Math.ceil(billableDesi(d)));
}

export type OrderDesiItem = {
  dimensions: PackageDimensions | null;
  quantity: number;
};

export type OrderDesiResult = {
  /** Toplam faturalanabilir desi (ambalaj payı dahil). Ölçüsü eksik kalem varsa yine de hesaplanır. */
  desi: number;
  /**
   * Taşıyıcının gerçekte ÜCRETLENDİRECEĞİ desi: yukarı yuvarlanır, en az 1 desi.
   * Ürünlerimizin çoğu 1 desiyi geçmediğinden kargo maliyeti pratikte SABİTTİR;
   * bu alanın amacı fiyatlandırma değil, "sipariş sabit maliyet bandını aştı mı" sinyali.
   * Hiç ölçülü kalem yoksa 0 — bilmediğimiz bir şey için 1 desi uydurmuyoruz.
   */
  tariffDesi: number;
  /** Ölçüsü girilmemiş kalem sayısı — >0 ise sonuç EKSİKTİR, kargo akışı uyarmalı. */
  missingCount: number;
};

/**
 * Sipariş desisi = Σ(kalem faturalanabilir desisi × adet) + ambalaj payı.
 *
 * Ölçüsü olmayan kalemler toplama katılmaz ama `missingCount` ile raporlanır —
 * sessizce 0 saymak, gerçek maliyetin altında bir gönderi oluşturulmasına yol açar.
 */
export function orderDesi(
  items: OrderDesiItem[],
  packagingMargin: number = PACKAGING_DESI_MARGIN,
): OrderDesiResult {
  let sum = 0;
  let missingCount = 0;

  for (const item of items) {
    if (!item.dimensions) {
      missingCount++;
      continue;
    }
    sum += billableDesi(item.dimensions) * item.quantity;
  }

  // Hiç ölçülü kalem yoksa ambalaj payı eklemek anlamsız (0 döner).
  const desi = sum > 0 ? round2(sum + packagingMargin) : 0;
  return { desi, tariffDesi: desi > 0 ? Math.max(1, Math.ceil(desi)) : 0, missingCount };
}
