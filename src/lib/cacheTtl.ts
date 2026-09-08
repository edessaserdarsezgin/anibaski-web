/**
 * `unstable_cache` için emniyet kemeri süreleri.
 *
 * Asıl güncelleme her zaman admin kaydındaki `revalidateTag(...)` ile anında olur. Ama
 * `revalidateTag` ORTAM YERELDİR, veritabanı ORTAKTIR: veri önizleme/yerel ortamdan değiştirilirse
 * canlının önbelleği hiç geçersizleştirilmez ve `revalidate` yoksa **süresiz** bayat kalır.
 * (2026-09-07: kargo ücreti 2 gün boyunca 10 ₺ eksik tahsil edildi — kök neden buydu.)
 *
 * TTL anında güncellemeyi yavaşlatmaz; yalnızca kaçırılan bir geçersizleştirmenin sonsuza kadar
 * sürmesini engeller. Süreler bayatlığın MALİYETİNE göre iki katmanda toplanmıştır.
 */
export const CACHE_TTL = {
  /** Bayatlığı yanlış fiyat/indirim gösterebilir — kısa tutulur. */
  pricing: 300,
  /** Bayatlığı yalnızca içerik/yapı gecikmesi yaratır (fiyat taşımaz). */
  content: 600,
} as const;
