// src/lib/shipping/dispatch.ts — kargo gönderisinin TEK yan etki noktası.
//
// Buradan başka hiçbir dosya `orders` tablosunun kargo kolonlarına yazmaz.
// Kolon adlandırması karışıktır (carrier/shipment_id/label_url/tracking_url snake,
// trackingCode camel) — bu eşlemenin bilindiği tek yer burasıdır.
//
// Bağımlılıklar parametreyle geçer (updateStatus.ts deseni): testte sahte istemci
// ve sahte bildirim verilebilsin diye.

import type { Shipment } from "./carrier/types";
import { isKnownCarrier, trackingUrl, carrierName } from "./carrier/registry";
import { CarrierError } from "./carrier/provider";

export type EmailPayload = {
  orderId: string;
  customerEmail: string;
  customerName: string | null;
  trackingCode: string;
  carrierName: string;
  trackingUrl: string | null;
};

export type WhatsAppPayload = {
  phone: string;
  orderNo: string;
  trackingCode: string;
  trackingUrl: string | null;
};

// Supabase istemcisinin yalnız kullandığımız yüzeyi. Tam tipi bağlamak testte
// devasa bir sahte nesne yazmayı gerektirirdi.
type SupabaseLike = {
  from(table: string): {
    update(patch: Record<string, unknown>): { eq(col: string, val: string): Promise<{ error: unknown }> };
    select(cols: string): { eq(col: string, val: string): { single(): Promise<{ data: Record<string, unknown> | null }> } };
  };
};

export type DispatchDeps = {
  supabase: SupabaseLike;
  sendEmail: (p: EmailPayload) => Promise<void>;
  sendWhatsApp: (p: WhatsAppPayload) => void;
};

/**
 * Oluşmuş bir gönderiyi siparişe kaydeder ve müşteriyi bilgilendirir.
 * Manuel giriş ve sağlayıcılı akış AYNI gövdeyi kullanır.
 */
export async function recordShipment(
  deps: DispatchDeps,
  orderId: string,
  shipment: Shipment,
): Promise<{ trackingUrl: string | null }> {
  const code = shipment.trackingCode?.trim();
  if (!code) throw new CarrierError("VALIDATION", "Kargo takip kodu gerekli");
  if (!isKnownCarrier(shipment.carrier)) {
    throw new CarrierError("VALIDATION", `Tanınmayan taşıyıcı: ${shipment.carrier}`);
  }

  const url = trackingUrl(shipment.carrier, code);

  const { error } = await deps.supabase
    .from("orders")
    .update({
      carrier: shipment.carrier,
      trackingCode: code,
      tracking_url: url,
      shipment_id: shipment.shipmentId,
      label_url: shipment.labelUrl,
      status: "SHIPPED",
    })
    .eq("id", orderId);

  if (error) {
    throw new CarrierError("CARRIER", `Sipariş güncellenemedi: ${String(error)}`);
  }

  await notifyCustomer(deps, orderId, shipment, code, url);
  return { trackingUrl: url };
}

/** Bildirimler ASLA akışı bozmaz — gönderi kaydı zaten yazıldı. */
async function notifyCustomer(
  deps: DispatchDeps,
  orderId: string,
  shipment: Shipment,
  code: string,
  url: string | null,
) {
  const { data: order } = await deps.supabase
    .from("orders").select('"userId", "addressId"').eq("id", orderId).single();
  if (!order?.userId) return;

  const { data: profile } = await deps.supabase
    .from("profiles").select('email, "fullName", phone').eq("id", String(order.userId)).single();
  const { data: address } = await deps.supabase
    .from("addresses").select("phone").eq("id", String(order.addressId ?? "")).single();

  const orderNo = orderId.slice(0, 8).toUpperCase();
  const phone = (profile?.phone as string) || (address?.phone as string);

  if (phone) {
    try {
      deps.sendWhatsApp({ phone, orderNo, trackingCode: code, trackingUrl: url });
    } catch (e) {
      console.error("[dispatch] WhatsApp bildirimi gönderilemedi:", e);
    }
  }

  if (profile?.email) {
    try {
      await deps.sendEmail({
        orderId,
        customerEmail: String(profile.email),
        customerName: (profile.fullName as string) ?? null,
        trackingCode: code,
        carrierName: carrierName(shipment.carrier),
        trackingUrl: url,
      });
    } catch (e) {
      console.error("[dispatch] e-posta gönderilemedi:", e);
    }
  }
}
