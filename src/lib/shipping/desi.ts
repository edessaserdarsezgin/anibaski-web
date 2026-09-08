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
 * Ürün hacimlerinin toplamına eklenen ambalaj payı (dolgu + koli cidarı + ürünler
 * arası kayıp hacim). Sektör kaynakları %10-20 bandını kullanıyor; ortasını aldık.
 */
export const PACKING_TOLERANCE = 0.15;

/**
 * Standart koli kademeleri. Sipariş, hacmini kurtaran EN KÜÇÜK kutuya konur ve desi
 * o kutunun dış ölçüsünden gelir — bu, sektörün "standart kutu kademe eşleştirmesi"
 * yöntemidir ve gerçek 3B kutu-yerleştirme (bin packing) algoritmasına gerek bırakmaz.
 *
 * ⚠️ Bu ölçüler sektör referans tablosudur (FulfillmentTR hazır koli standardı).
 * AnıBaskı'nın gerçek ambalaj malzemeleri belli olunca BURASI güncellenmeli —
 * özellikle düz baskı için kutu değil karton zarf/kargo poşeti kullanılacaksa
 * (kaynaklar düz üründe kutuyu "boş hava taşımak" olarak niteliyor).
 */
export type BoxSize = "S" | "M" | "L" | "XL";

export const STANDARD_BOXES: { size: BoxSize; length: number; width: number; height: number }[] = [
  { size: "S",  length: 20, width: 15, height: 10 },  // 1 desi
  { size: "M",  length: 30, width: 20, height: 15 },  // 3 desi
  { size: "L",  length: 40, width: 30, height: 20 },  // 8 desi
  { size: "XL", length: 60, width: 40, height: 40 },  // 32 desi
];

function boxVolume(b: { length: number; width: number; height: number }): number {
  return b.length * b.width * b.height;
}

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
  /** Konsolide kolinin (veya kolilerin) faturalanabilir desisi. */
  desi: number;
  /**
   * Taşıyıcının gerçekte ÜCRETLENDİRECEĞİ desi: yukarı yuvarlanır, en az 1 desi.
   * Ürünlerimizin çoğu 1 desiyi geçmediğinden kargo maliyeti pratikte SABİTTİR;
   * bu alanın amacı fiyatlandırma değil, "sipariş sabit maliyet bandını aştı mı" sinyali.
   * Hiç ölçülü kalem yoksa 0 — bilmediğimiz bir şey için 1 desi uydurmuyoruz.
   */
  tariffDesi: number;
  /** Seçilen standart kutu; ölçülü kalem yoksa null. */
  box: BoxSize | null;
  /** Kaç koli çıktığı. En büyük kutu yetmezse sipariş bölünür (>1). */
  parcelCount: number;
  /** Ölçüsü girilmemiş kalem sayısı — >0 ise sonuç EKSİKTİR, kargo akışı uyarmalı. */
  missingCount: number;
};

/**
 * Sipariş desisi — kalem desileri TOPLANMAZ.
 *
 * Sektör kuralı: çok kalemli siparişte desi, birleştirilmiş kolinin dış ölçüsünden
 * hesaplanır. Kalem desilerini toplamak, her ürünün etrafındaki boş havayı da toplamak
 * demektir ve sistematik olarak gerçeğin çok üstünde bir sonuç verir (kaynaklar
 * konsolidasyonun maliyeti %40'a kadar düşürdüğünü söylüyor).
 *
 * Yöntem: ürün hacimlerini topla → ambalaj toleransı ekle → hacmi kurtaran en küçük
 * standart kutuyu seç → desiyi o kutudan al. Ağırlık ise hacmin aksine fiziksel olarak
 * toplanabilir olduğu için adetle çarpılıp toplanır; ikisinin BÜYÜĞÜ faturalanır.
 *
 * Ölçüsü olmayan kalemler hesaba katılmaz ama `missingCount` ile raporlanır —
 * sessizce 0 saymak, gerçek maliyetin altında bir gönderi oluşturulmasına yol açar.
 */
export function orderDesi(
  items: OrderDesiItem[],
  tolerance: number = PACKING_TOLERANCE,
): OrderDesiResult {
  let volume = 0;
  let weight = 0;
  let missingCount = 0;

  for (const item of items) {
    if (!item.dimensions) {
      missingCount++;
      continue;
    }
    const d = item.dimensions;
    volume += d.length * d.width * d.height * item.quantity;
    weight += d.weight * item.quantity;
  }

  if (volume <= 0) return { desi: 0, tariffDesi: 0, box: null, parcelCount: 0, missingCount };

  const needed = volume * (1 + tolerance);
  const largest = STANDARD_BOXES[STANDARD_BOXES.length - 1];
  const fitting = STANDARD_BOXES.find(b => boxVolume(b) >= needed);

  // Tek koliye sığmıyorsa sipariş bölünür; ayrı kolilerin desileri (bu kez doğru olarak) toplanır.
  const box = fitting ?? largest;
  const parcelCount = fitting ? 1 : Math.ceil(needed / boxVolume(largest));
  const volumetric = round2((boxVolume(box) / DESI_DIVISOR) * parcelCount);

  const desi = round2(Math.max(volumetric, weight));
  return {
    desi,
    tariffDesi: Math.max(1, Math.ceil(desi)),
    box: box.size,
    parcelCount,
    missingCount,
  };
}
