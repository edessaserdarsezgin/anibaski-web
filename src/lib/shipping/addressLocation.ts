// src/lib/shipping/addressLocation.ts — adresin il/ilçe alanlarının SUNUCU tarafı doğrulaması.
//
// Neden sunucuda: istemci artık il ve ilçeyi seçim kutusundan alıyor, ama istemciye
// güvenilmez (sipariş fiyatlarını sunucuda yeniden hesaplama kararımızla aynı ilke).
// Doğrudan API'ye atılan bir istek serbest metin ilçe yazamamalı — yazarsa taşıyıcı
// gönderi oluştururken eşleşmeyen ada takılır.
//
// POST ve PATCH aynı mantığı paylaşır; kopyalanmaması için tek modül.

import { cityCodeFromName } from "./cities";
import { normalizeDistrict } from "./districts";

export type AddressLocation =
  | { ok: true; city_code: string; district: string }
  | { ok: false; error: string };

export function resolveAddressLocation(input: {
  city: string | null | undefined;
  cityCode: string | null | undefined;
  district: string | null | undefined;
}): AddressLocation {
  // Kod istemciden gelmezse il adından türetilir (eski istemci uyumu).
  const city_code = input.cityCode?.trim() || cityCodeFromName(input.city);
  if (!city_code) {
    return { ok: false, error: "Geçerli bir il seçin" };
  }

  const district = normalizeDistrict(city_code, input.district);
  if (!district) {
    return { ok: false, error: "Geçerli bir ilçe seçin" };
  }

  return { ok: true, city_code, district };
}
