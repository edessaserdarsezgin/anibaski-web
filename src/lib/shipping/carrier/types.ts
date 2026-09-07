// src/lib/shipping/carrier/types.ts — kargo alanının sözlüğü. Tip-only, runtime kodu YOK.
//
// Buradaki adlar BİZİM iş dilimizdir; hiçbir taşıyıcının alan adı (Aras'ın
// ReceiverCityName'i, bir agregatörün state_id'si) buraya sızmaz. Taşıyıcıya özgü
// çeviri, o taşıyıcının adaptör dosyasının içinde kalır.

/** Tanınan taşıyıcılar. "other" = adı bilinmeyen/listede olmayan taşıyıcı. */
export type CarrierId = "aras" | "yurtici" | "surat" | "ptt" | "mng" | "other";

/** Bir gönderi oluşturmak için taşıyıcıya verilecek her şey. */
export type ShipmentRequest = {
  /** orders.id — taşıyıcıda referans/entegrasyon kodu; aynı siparişin iki kez
   *  gönderilmesini engelleyen idempotency çapası. */
  orderRef: string;
  receiver: {
    name: string;
    phone: string;
    address: string;
    /** İl plaka kodu, iki hane ("34"). Taşıyıcılar il'i metin değil KOD bekliyor. */
    cityCode: string;
    cityName: string;
    /** İlçe adı. Plaka gibi bir ilçe kodumuz yok; taşıyıcılar adı kabul ediyor. */
    townName: string;
  };
  parcel: {
    /** Faturalanabilir desi (ambalaj payı dahil) — bkz. lib/shipping/desi.ts */
    desi: number;
    pieceCount: number;
  };
  /** Kapıda ödeme; kartla ödenmiş siparişte null. */
  cod: { amount: number } | null;
  description: string;
};

/** Oluşmuş bir gönderinin bizi ilgilendiren kimliği. */
export type Shipment = {
  carrier: CarrierId;
  /** Taşıyıcının kendi kayıt kimliği; manuel girişte null. */
  shipmentId: string | null;
  trackingCode: string;
  /** Etiket (PDF) bağlantısı; manuel girişte null. */
  labelUrl: string | null;
};

/**
 * TAŞIYICININ dili — sipariş durumu (`orders.status`) DEĞİL.
 * orders.status bir Postgres enum'dur ve içinde RETURNED yoktur; eşleme dar
 * tutulur: yalnız DELIVERED sipariş durumuna yansır.
 */
export type ShipmentStatus =
  | "IN_TRANSIT" | "DELIVERED" | "RETURNED" | "CANCELLED" | "UNKNOWN";
