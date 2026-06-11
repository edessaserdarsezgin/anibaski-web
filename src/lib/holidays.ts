/**
 * Türkiye tatil günleri — kargo çalışmayan günler.
 *
 * Sabit tarihli resmî tatiller burada (her yıl aynı, bakım gerektirmez).
 * Dini bayramlar (Ramazan/Kurban) ve özel tatiller ay takvimine bağlı her yıl
 * kaydığından KOD'da tutulmaz — admin "Kargo Ayarları > Ek Tatil Günleri"
 * alanına Diyanet'in resmî tarihlerini (YYYY-MM-DD) girer. Böylece yanlış
 * tarih riski olmadan güncel kalır.
 *
 * Sunucu bağımlılığı yok → client bileşeninden de import edilebilir.
 */

// Sabit tarihli resmî tatiller (MM-DD). Yarım günler (28 Ekim öğleden sonra,
// arife günleri) dahil edilmedi — kargo o gün kısmen çalışabilir.
const FIXED_MMDD = ["01-01", "04-23", "05-01", "05-19", "07-15", "08-30", "10-29"];

export function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isNationalHoliday(d: Date): boolean {
  const mmdd = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return FIXED_MMDD.includes(mmdd);
}

/** "YYYY-MM-DD" satır/virgül/noktalı virgülle ayrılmış metni geçerli tarih Set'ine çevirir. */
export function parseHolidaySet(raw: string | null | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw.split(/[\n,;]+/).map((s) => s.trim()).filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
  );
}

/** Hafta sonu mu, resmî tatil mi, yoksa admin'in girdiği ek tatil mi? (kargo çalışmaz) */
export function isNonWorkingDay(d: Date, extraHolidays: Set<string>): boolean {
  const day = d.getDay();
  if (day === 0 || day === 6) return true; // Pazar / Cumartesi
  if (isNationalHoliday(d)) return true;
  return extraHolidays.has(toYMD(d));
}
