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
import type { CarrierProvider } from "./carrier/provider";
import { buildShipmentRequest } from "./carrier/request";

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
type QueryResult = Promise<{ data: Record<string, unknown>[] | null }> & {
  single(): Promise<{ data: Record<string, unknown> | null }>;
};

type SupabaseLike = {
  from(table: string): {
    update(patch: Record<string, unknown>): { eq(col: string, val: string): Promise<{ error: unknown }> };
    select(cols: string): { eq(col: string, val: string): QueryResult };
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

  // shipment_id/label_url yalnız dolu olduklarında yazılır: manuel giriş ikisini de
  // her zaman null yollar — koşulsuz yazsaydık, bir taşıyıcı adaptörü bağlandığında
  // admin takip kodunu elle düzeltince sağlayıcının shipment_id'si silinir ve
  // dispatchOrder'ın idempotency kapısı (order.shipment_id kontrolü) devre dışı kalırdı.
  const patch: Record<string, unknown> = {
    carrier: shipment.carrier,
    trackingCode: code,
    tracking_url: url,
    status: "SHIPPED",
  };
  if (shipment.shipmentId !== null) patch.shipment_id = shipment.shipmentId;
  if (shipment.labelUrl !== null) patch.label_url = shipment.labelUrl;

  const { error } = await deps.supabase
    .from("orders")
    .update(patch)
    .eq("id", orderId);

  if (error) {
    const detail = (error as { message?: string })?.message ?? JSON.stringify(error);
    throw new CarrierError("CARRIER", `Sipariş güncellenemedi: ${detail}`);
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

  const [{ data: profile }, { data: address }] = await Promise.all([
    deps.supabase.from("profiles").select('email, "fullName", phone').eq("id", String(order.userId)).single(),
    order.addressId
      ? deps.supabase.from("addresses").select("phone").eq("id", String(order.addressId)).single()
      : Promise.resolve({ data: null }),
  ]);

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

/**
 * Taşıyıcı API'si üzerinden gönderi oluşturur ve recordShipment ile kaydeder.
 *
 * Bugün üretimde çağıranı yoktur (getCarrierProvider() null döner). Sahte
 * sağlayıcıyla testte uçtan uca çalışır; bir adaptör yazıldığında burada
 * DEĞİŞİKLİK GEREKMEZ — bu fonksiyonun değişmemesi tasarımın sınavıdır.
 */
export async function dispatchOrder(
  deps: DispatchDeps,
  orderId: string,
  provider: CarrierProvider | null,
): Promise<{ trackingUrl: string | null }> {
  if (!provider) {
    throw new CarrierError(
      "UNSUPPORTED",
      "Otomatik gönderi oluşturulamaz: manuel modda takip kodu elle girilir",
    );
  }

  const { data: order } = await deps.supabase
    .from("orders")
    .select('id, total, "paymentMethod", "addressId", shipment_id')
    .eq("id", orderId)
    .single();

  if (!order) throw new CarrierError("VALIDATION", "Sipariş bulunamadı");
  if (order.shipment_id) {
    throw new CarrierError("VALIDATION", "Bu sipariş için zaten bir gönderi oluşturulmuş");
  }

  const { data: address } = await deps.supabase
    .from("addresses")
    .select('"fullName", phone, address, city, district, city_code')
    .eq("id", String(order.addressId))
    .single();

  if (!address) throw new CarrierError("VALIDATION", "Teslimat adresi bulunamadı");

  const { data: rows } = await deps.supabase
    .from("order_items")
    .select("quantity, product:products(name, length_cm, width_cm, height_cm, weight_kg)")
    .eq("orderId", orderId);

  const items = (rows ?? []).map((r) => {
    const p = (r.product ?? {}) as Record<string, number | string | null>;
    return {
      productName: String(p.name ?? "Bilinmeyen ürün"),
      quantity: Number(r.quantity),
      dimensions: {
        length_cm: (p.length_cm as number) ?? null,
        width_cm: (p.width_cm as number) ?? null,
        height_cm: (p.height_cm as number) ?? null,
        weight_kg: (p.weight_kg as number) ?? null,
      },
    };
  });

  const built = buildShipmentRequest({
    order: {
      id: String(order.id),
      total: Number(order.total),
      paymentMethod: String(order.paymentMethod),
    },
    address: {
      fullName: String(address.fullName ?? ""),
      phone: String(address.phone ?? ""),
      address: String(address.address ?? ""),
      city: String(address.city ?? ""),
      district: String(address.district ?? ""),
      city_code: (address.city_code as string) ?? null,
    },
    items,
  });

  if (!built.ok) {
    throw new CarrierError("VALIDATION", built.missing.join(" · "));
  }

  const shipment = await provider.createShipment(built.request);
  return recordShipment(deps, orderId, shipment);
}
