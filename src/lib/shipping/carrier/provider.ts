// src/lib/shipping/carrier/provider.ts — taşıyıcı sağlayıcısının genişleme noktası.
//
// Desen kaynağı: src/lib/aiUpscale.ts — "sağlayıcı değişince YALNIZ bu dosya değişir".
// Yeni bir taşıyıcı eklemek = bu arayüzü uygulayan bir dosya yazmak + aşağıdaki
// fabrikaya bir satır eklemek. dispatch.ts ve çağıranları DEĞİŞMEZ.

import type { CarrierId, ShipmentRequest, Shipment, ShipmentStatus } from "./types";

/**
 * Bir taşıyıcı API'sinin bize verebileceği yetenekler.
 *
 * Kasten yalnız iki metot: etiket URL'i createShipment sonucunda geliyor, fiyat
 * sorgusu gerekmiyor (kargo ücretimiz sabit — DECISIONS.md), iptal ise manuel
 * akışta şubede yapılıyor. Bugün kanıtlayamadığımız yeteneğe arayüzde söz verilmez.
 */
export interface CarrierProvider {
  readonly id: CarrierId;
  createShipment(req: ShipmentRequest): Promise<Shipment>;
  getStatus(shipmentId: string): Promise<ShipmentStatus>;
}

export type CarrierErrorCode =
  | "CONFIG"       // yapılandırma eksik (env, kimlik bilgisi)
  | "VALIDATION"   // gönderi isteği kurulamadı (eksik ölçü, plaka kodu…)
  | "CARRIER"      // taşıyıcı hata döndürdü
  | "UNSUPPORTED"; // bu modda desteklenmiyor (ör. manuel modda otomatik gönderi)

/** Kod tabanındaki tek class deseni (UpscaleError) ile aynı biçim. */
export class CarrierError extends Error {
  constructor(public readonly code: CarrierErrorCode, message: string) {
    super(message);
    this.name = "CarrierError";
  }
}

/**
 * Etkin taşıyıcı sağlayıcısı, yoksa null.
 *
 * `null` = MANUEL MOD: gönderiyi admin fiziksel olarak oluşturur, takip kodunu
 * sisteme yapıştırır. Bu bir eksiklik değil, geçerli bir çalışma biçimidir —
 * bu yüzden "hiçbir şey yapmayan sahte sağlayıcı" döndürmüyoruz: öyle bir nesne
 * createShipment çağrıldığında fırlatmak zorunda kalır ve arayüz yalan söyler.
 *
 * Bir taşıyıcı adaptörü yazıldığında buraya tek bir case eklenir.
 */
export function getCarrierProvider(): CarrierProvider | null {
  const configured = process.env.SHIPPING_CARRIER?.trim();
  if (!configured || configured === "manual") return null;

  switch (configured) {
    // case "aras": return arasProvider;   ← adaptör yazıldığında açılacak
    default:
      return null;
  }
}
