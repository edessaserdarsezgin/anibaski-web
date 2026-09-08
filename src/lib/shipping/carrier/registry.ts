// src/lib/shipping/carrier/registry.ts — tanınan taşıyıcılar. Saf veri + saf fonksiyon.
//
// Neden ayrı bir kayıt defteri: taşıyıcı kimliği (`orders.carrier`) ile o taşıyıcıya
// API bağlantısı olup olmadığı FARKLI şeylerdir. Admin bugün elle "Aras" seçebilir;
// Aras adaptörü hiç yazılmamış olabilir. Bu dosya yalnızca "hangi taşıyıcılar var ve
// takip linki nasıl kurulur" sorusunu yanıtlar.

import type { CarrierId } from "./types";

type CarrierInfo = {
  id: CarrierId;
  name: string;
  /** Takip sayfası şablonu; {code} yerine URL-encode edilmiş kod konur. null = link yok. */
  trackingUrlTemplate: string | null;
};

// Şablon doğrulama durumu (2026-09-08, sahte kodla sunucudan denendi):
//   aras    ✅ parametre tanınıyor, "sonuç bulunamamıştır" dönüyor
//   mng     ⚠️ 301 → kargotakip.dhlecommerce.com.tr (MNG artık DHL eCommerce); yönlendirme
//              üzerinden çalışıyor, zincir kopabilir
//   yurtici ❌ "?code=" sorguyu ÖNDOLDURMUYOR — müşteri kodu elle yazmak zorunda kalır
//   ptt     ❓ /Track/Verify?q= 302 ile ptt.gov.tr'ye atıyor (ölü yol mu bot engeli mi belirsiz)
//   surat   ❓ 403 (bot koruması) — sunucudan test edilemedi
// Aras dışındakiler kasten düzeltilmedi: taşıyıcı anlaşması yapılmayabilir, boşa iş yükü olur.
// Yalnızca o taşıyıcıyla çalışmaya karar verilirse tarayıcıda doğrulanıp düzeltilmeli.

/** Sıra admin açılır listesinde görünen sıradır; "other" her zaman sonda. */
export const CARRIERS: CarrierInfo[] = [
  { id: "aras",    name: "Aras Kargo",    trackingUrlTemplate: "https://kargotakip.araskargo.com.tr/mainpage.aspx?code={code}" },
  { id: "yurtici", name: "Yurtiçi Kargo", trackingUrlTemplate: "https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code={code}" },
  { id: "surat",   name: "Sürat Kargo",   trackingUrlTemplate: "https://www.suratkargo.com.tr/KargoTakip/?kargotakipno={code}" },
  { id: "ptt",     name: "PTT Kargo",     trackingUrlTemplate: "https://gonderitakip.ptt.gov.tr/Track/Verify?q={code}" },
  { id: "mng",     name: "MNG Kargo",     trackingUrlTemplate: "https://kargotakip.mngkargo.com.tr/?takipNo={code}" },
  { id: "other",   name: "Diğer",         trackingUrlTemplate: null },
];

const BY_ID = new Map<CarrierId, CarrierInfo>(CARRIERS.map(c => [c.id, c]));

/** Serbest metnin tanınan bir taşıyıcı kimliği olup olmadığını daraltarak söyler. */
export function isKnownCarrier(value: string): value is CarrierId {
  return BY_ID.has(value as CarrierId);
}

/** Görünen ad (admin listesi, müşteri e-postası). */
export function carrierName(id: CarrierId): string {
  return BY_ID.get(id)?.name ?? "Diğer";
}

/**
 * Müşteriye gösterilecek takip bağlantısı. Şablonu olmayan taşıyıcıda veya boş
 * kodda null döner — çağıran taraf linksiz gösterime düşmelidir.
 */
export function trackingUrl(id: CarrierId, code: string): string | null {
  const template = BY_ID.get(id)?.trackingUrlTemplate;
  const trimmed = code.trim();
  if (!template || !trimmed) return null;
  return template.replace("{code}", encodeURIComponent(trimmed));
}

/** CustomSelect için hazır seçenek listesi (cities.ts'teki CITY_OPTIONS ile aynı desen). */
export const CARRIER_OPTIONS = CARRIERS.map(c => ({ value: c.id, label: c.name }));
