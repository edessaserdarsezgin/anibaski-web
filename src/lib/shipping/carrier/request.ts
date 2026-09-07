// src/lib/shipping/carrier/request.ts — sipariş verisinden gönderi isteği kurar. SAF.
//
// Bu dosya Faz 0'ın (products ölçüleri + addresses.city_code + desi.ts + cities.ts)
// karşılığını aldığı yerdir ve hiçbir sağlayıcıya bağlı değildir.
//
// Fırlatmaz: eksik veriyi `missing` listesiyle döner. Gerekçe desi.ts'te yazılı —
// eksik ölçüyü sessizce 0 saymak, gerçek maliyetin ALTINDA bir gönderi oluşturur.

import type { ShipmentRequest } from "./types";
import { orderDesi, toDimensions, type ProductDimensionFields } from "../desi";
import { cityNameFromCode } from "../cities";

export type BuildInput = {
  order: { id: string; total: number; paymentMethod: string };
  address: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    city_code: string | null;
  };
  items: { productName: string; quantity: number; dimensions: ProductDimensionFields }[];
};

export type BuildResult =
  | { ok: true; request: ShipmentRequest }
  | { ok: false; missing: string[] };

export function buildShipmentRequest(input: BuildInput): BuildResult {
  const { order, address, items } = input;
  const missing: string[] = [];

  if (!address.fullName?.trim()) missing.push("Adreste alıcı adı yok");
  if (!address.phone?.trim()) missing.push("Adreste telefon yok");
  if (!address.address?.trim()) missing.push("Adres satırı boş");
  if (!address.district?.trim()) missing.push("Adreste ilçe yok");
  if (!address.city_code?.trim()) {
    missing.push(`Adreste il plaka kodu yok (il: "${address.city || "—"}") — profil adresinden il yeniden seçilmeli`);
  }

  if (items.length === 0) missing.push("Siparişte kalem yok");

  for (const item of items) {
    if (!toDimensions(item.dimensions)) {
      missing.push(`Ürün ölçüsü girilmemiş: ${item.productName}`);
    }
  }

  if (missing.length > 0) return { ok: false, missing };

  const { desi } = orderDesi(
    items.map(i => ({ dimensions: toDimensions(i.dimensions), quantity: i.quantity })),
  );

  return {
    ok: true,
    request: {
      orderRef: order.id,
      receiver: {
        name: address.fullName.trim(),
        phone: address.phone.trim(),
        address: address.address.trim(),
        cityCode: (address.city_code as string).trim(),
        // Resmî il adını koddan üretiyoruz: adresteki serbest metin "istanbul" olabilir,
        // taşıyıcı ise kendi yazımını bekler.
        cityName: cityNameFromCode(address.city_code) ?? address.city.trim(),
        townName: address.district.trim(),
      },
      // Tek koli varsayımı: kalemler tek pakete giriyor, ambalaj payı desiye eklendi.
      // Çok kolili gönderi (bin packing) bilinçli olarak yapılmıyor — bkz. desi.ts.
      parcel: { desi, pieceCount: 1 },
      cod: order.paymentMethod === "cod" ? { amount: order.total } : null,
      description: `AnıBaskı sipariş #${order.id.slice(0, 8).toUpperCase()}`,
    },
  };
}
