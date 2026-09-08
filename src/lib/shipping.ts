import { unstable_cache } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/server";
import { CACHE_TTL } from "@/lib/cacheTtl";
import { expandRange, parseHolidaySet } from "@/lib/holidays";

export type ShippingSettings = {
  shippingFee: number;
  freeShippingThreshold: number;
  codFee: number;
  productionTime: string;
  shippingTime: string;
  orderCutoffNote: string;
  dispatchCutoffHour: number;    // hafta içi bu saatten önceki siparişler aynı gün kabul (TR saati)
  dispatchBusinessDays: number;  // kabul gününden kargoya verilişe kaç iş günü
  extraHolidays: string;         // ek tatil günleri (dini bayram/özel), YYYY-MM-DD satır ayrılmış
};

export class ShippingSettingsError extends Error {
  constructor(reason: string) {
    super(`Kargo ayarları okunamadı — ${reason}`);
    this.name = "ShippingSettingsError";
  }
}

// Yalnızca metin/zaman alanlarının yedeği var: yanlış değerin parasal karşılığı yok.
// Parasal alanların (kargo ücreti, ücretsiz kargo eşiği, kapıda ödeme) yedeği KASTEN yoktur —
// ayar okunamadığında sessizce yanlış fiyatla satmaktansa hata veriyoruz. Yedek değer koyan
// bir sonraki geliştirici, o değer önbelleğe girdiği anda süresiz eksik tahsilat yaratır.
export const SHIPPING_TEXT_DEFAULTS = {
  productionTime: "2–3 iş günü",
  shippingTime: "1–3 iş günü",
  orderCutoffNote: "Siparişler hafta içi 14:00'a kadar verilirse aynı gün üretime alınır.",
  dispatchCutoffHour: 14,
  dispatchBusinessDays: 0,
} as const;

type ShippingSettingsRow = {
  shipping_fee: unknown;
  free_shipping_threshold: unknown;
  cod_fee: unknown;
  production_time?: string | null;
  shipping_time?: string | null;
  order_cutoff_note?: string | null;
  dispatch_cutoff_hour?: number | null;
  dispatch_business_days?: number | null;
  ramazan_start?: string | null;
  ramazan_end?: string | null;
  kurban_start?: string | null;
  kurban_end?: string | null;
  extra_holidays?: string | null;
};

// numeric kolonlar sürücüden string gelebilir; null/boş/negatif Number() ile sessizce 0 olur — o yüzden ayrı elenir
function money(value: unknown, field: string): number {
  if (value === null || value === undefined || value === "") {
    throw new ShippingSettingsError(`${field} boş`);
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new ShippingSettingsError(`${field} geçersiz: ${String(value)}`);
  }
  return n;
}

export function parseShippingSettings(row: ShippingSettingsRow | null | undefined): ShippingSettings {
  if (!row) throw new ShippingSettingsError("shipping_settings satırı bulunamadı");
  return {
    shippingFee: money(row.shipping_fee, "shipping_fee"),
    freeShippingThreshold: money(row.free_shipping_threshold, "free_shipping_threshold"),
    codFee: money(row.cod_fee, "cod_fee"),
    productionTime: row.production_time?.trim() || SHIPPING_TEXT_DEFAULTS.productionTime,
    shippingTime: row.shipping_time?.trim() || SHIPPING_TEXT_DEFAULTS.shippingTime,
    orderCutoffNote: row.order_cutoff_note?.trim() || SHIPPING_TEXT_DEFAULTS.orderCutoffNote,
    dispatchCutoffHour: row.dispatch_cutoff_hour ?? SHIPPING_TEXT_DEFAULTS.dispatchCutoffHour,
    dispatchBusinessDays: row.dispatch_business_days ?? SHIPPING_TEXT_DEFAULTS.dispatchBusinessDays,
    // Bayram aralıkları + serbest özel tatilleri tek tatil listesine birleştir (component bunu tüketir)
    extraHolidays: Array.from(new Set([
      ...expandRange(row.ramazan_start, row.ramazan_end),
      ...expandRange(row.kurban_start, row.kurban_end),
      ...parseHolidaySet(row.extra_holidays),
    ])).sort().join("\n"),
  };
}

export const getShippingSettings = unstable_cache(
  async (): Promise<ShippingSettings> => {
    try {
      const supabase = await createAdminClient();
      const { data, error } = await supabase
        .from("shipping_settings")
        .select("shipping_fee, free_shipping_threshold, cod_fee, production_time, shipping_time, order_cutoff_note, dispatch_cutoff_hour, dispatch_business_days, ramazan_start, ramazan_end, kurban_start, kurban_end, extra_holidays")
        .eq("id", 1)
        .single();
      if (error) throw new ShippingSettingsError(`sorgu hatası: ${error.message}`);
      return parseShippingSettings(data);
    } catch (err) {
      // Hata yutulmaz: Sentry'ye düşer ve çağırana yükselir. Fırlatılan hata önbelleğe girmez,
      // bir sonraki istek yeniden dener.
      const e = err instanceof ShippingSettingsError ? err : new ShippingSettingsError(String(err));
      Sentry.captureException(e);
      throw e;
    }
  },
  ["shipping-settings"],
  // revalidate = emniyet kemeri. Asıl güncelleme admin kaydında revalidateTag("shipping") ile anında
  // olur; ama revalidateTag ORTAM YERELDİR, veritabanı ORTAKTIR — ayar başka bir ortamdan (önizleme/
  // yerel) kaydedilirse canlının önbelleği geçersizleştirilmez ve süresiz bayat kalır (2026-09-07'de
  // 2 gün eksik tahsilat). TTL ile en kötü ihtimalle 5 dakikada kendi kendine düzelir.
  { tags: ["shipping"], revalidate: CACHE_TTL.pricing }
);

export type DeliveryDisplaySettings = Pick<
  ShippingSettings,
  "productionTime" | "shippingTime" | "orderCutoffNote" | "dispatchCutoffHour" | "dispatchBusinessDays" | "extraHolidays"
>;

// Teslimat tahmini / metin alanları — parasal değer içermez. Ayar okunamazsa sayfayı düşürmek yerine
// varsayılan metinlerle devam eder; hata zaten getShippingSettings içinde Sentry'ye düşmüştür.
export async function getDeliveryDisplaySettings(): Promise<DeliveryDisplaySettings> {
  try {
    return await getShippingSettings();
  } catch {
    return { ...SHIPPING_TEXT_DEFAULTS, extraHolidays: "" };
  }
}

// Parasal alan gösteren ama kritik olmayan vitrin yerleri için: okunamazsa null döner,
// çağıran ilgili bölümü GİZLER (yanlış tutar göstermez), sayfanın kalanı ayakta kalır.
export async function getShippingSettingsOrNull(): Promise<ShippingSettings | null> {
  try {
    return await getShippingSettings();
  } catch {
    return null;
  }
}
