/**
 * Telefonu kanonik forma indirger: yalnız rakamlar, son 10 hane.
 * Tekillik karşılaştırması için tek kaynak. SQL karşılığı:
 *   right(regexp_replace(phone, '\D', '', 'g'), 10)
 * Örnek: "05302751765", "+90 530 275 17 65", "5302751765" → "5302751765"
 */
export function normalizePhone(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\D/g, "").slice(-10);
}
