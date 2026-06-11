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

/**
 * Başlangıç–bitiş tarih aralığını (dahil) YYYY-MM-DD listesine açar.
 * Ramazan/Kurban Bayramı admin tarih seçicilerinden gelir. Bitiş boşsa tek gün,
 * ters/geçersizse boş. Güvenlik için en fazla 40 gün.
 */
export function expandRange(start?: string | null, end?: string | null): string[] {
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return [];
  const s = new Date(`${start}T00:00:00`);
  const e = end && /^\d{4}-\d{2}-\d{2}$/.test(end) ? new Date(`${end}T00:00:00`) : s;
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return [start];
  const out: string[] = [];
  const cur = new Date(s);
  let guard = 0;
  while (cur <= e && guard < 40) {
    out.push(toYMD(cur));
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
  return out;
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
