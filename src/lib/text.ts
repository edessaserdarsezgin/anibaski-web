// src/lib/text.ts — metin karşılaştırma yardımcıları. Saf, bağımlılıksız.

/**
 * Türkçe duyarlı karşılaştırma anahtarı: küçük harfe indirir, İ/I/ı ayrımını ve
 * aksanları siler, boşluk/nokta/tire/alt çizgiyi atar. "kadikoy" ≡ "Kadıköy".
 *
 * Neden özel bir fonksiyon: `toLowerCase()` tek başına yetmez — "İSTANBUL".toLowerCase()
 * JS'te "i̇stanbul" (i + birleşen nokta) üretir ve doğrudan karşılaştırma sessizce
 * başarısız olur. İ/I/ı bu yüzden önce sadeleştirilir.
 *
 * Kullananlar: il eşleştirme (`shipping/cities.ts`), ilçe eşleştirme
 * (`shipping/districts.ts`), açılır menüde harfe atlama (`ui/CustomSelect.tsx`).
 */
export function trKey(s: string): string {
  return s
    .replace(/İ/g, "i").replace(/I/g, "i").replace(/ı/g, "i")
    .toLocaleLowerCase("tr")
    .replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a")
    .replace(/[\s._-]/g, "");
}
