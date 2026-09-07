import { describe, it, expect, vi } from "vitest";
import { recordShipment, dispatchOrder } from "./dispatch";
import type { EmailPayload } from "./dispatch";
import type { CarrierProvider } from "./carrier/provider";

/** orders güncellemesini ve profil/adres okumalarını taklit eden asgari sahte istemci. */
function fakeSupabase(order: Record<string, unknown> = {}, updateError: unknown = null) {
  const updates: Record<string, unknown>[] = [];
  const client = {
    updates,
    from(table: string) {
      return {
        update(patch: Record<string, unknown>) {
          updates.push({ table, ...patch });
          return { eq: async () => ({ error: updateError }) };
        },
        select() {
          return {
            eq() {
              return {
                single: async () => ({
                  data: {
                    userId: "u1", addressId: "a1",
                    email: "musteri@example.com", fullName: "Ayşe Yılmaz",
                    phone: "05551112233",
                    ...order,
                  },
                }),
              };
            },
          };
        },
      };
    },
  };
  return client;
}

function deps(supabase = fakeSupabase()) {
  return {
    supabase: supabase as never,
    sendEmail: vi.fn(async (_p: EmailPayload) => {}),
    sendWhatsApp: vi.fn(() => {}),
  };
}

describe("recordShipment", () => {
  it("taşıyıcıyı, kodu, takip linkini ve SHIPPED durumunu yazar", async () => {
    const supabase = fakeSupabase();
    const d = deps(supabase);
    await recordShipment(d, "ord_1", {
      carrier: "aras", trackingCode: "1234567890", shipmentId: null, labelUrl: null,
    });

    const patch = supabase.updates.find(u => u.table === "orders");
    expect(patch).toMatchObject({
      carrier: "aras",
      trackingCode: "1234567890",
      status: "SHIPPED",
    });
    expect(String(patch!.tracking_url)).toContain("1234567890");
  });

  it("sağlayıcıdan gelen gönderi kimliği ve etiketi de yazılır", async () => {
    const supabase = fakeSupabase();
    await recordShipment(deps(supabase), "ord_1", {
      carrier: "aras", trackingCode: "999", shipmentId: "ARAS-1", labelUrl: "https://x/l.pdf",
    });
    expect(supabase.updates[0]).toMatchObject({
      shipment_id: "ARAS-1", label_url: "https://x/l.pdf",
    });
  });

  it("takip URL'i olmayan taşıyıcıda tracking_url null yazılır", async () => {
    const supabase = fakeSupabase();
    await recordShipment(deps(supabase), "ord_1", {
      carrier: "other", trackingCode: "abc", shipmentId: null, labelUrl: null,
    });
    expect(supabase.updates[0].tracking_url).toBeNull();
  });

  it("müşteriye e-posta ve WhatsApp bildirimi gönderir", async () => {
    const d = deps();
    await recordShipment(d, "ord_1", {
      carrier: "aras", trackingCode: "1234567890", shipmentId: null, labelUrl: null,
    });
    expect(d.sendEmail).toHaveBeenCalledOnce();
    expect(d.sendWhatsApp).toHaveBeenCalledOnce();
    expect(d.sendEmail.mock.calls[0][0]).toMatchObject({
      customerEmail: "musteri@example.com",
      trackingCode: "1234567890",
      carrierName: "Aras Kargo",
    });
  });

  it("e-posta hatası akışı bozmaz", async () => {
    const d = { ...deps(), sendEmail: vi.fn(async (_p: EmailPayload) => { throw new Error("resend down"); }) };
    await expect(recordShipment(d, "ord_1", {
      carrier: "aras", trackingCode: "1", shipmentId: null, labelUrl: null,
    })).resolves.toBeDefined();
  });

  it("boş takip kodunu reddeder", async () => {
    await expect(recordShipment(deps(), "ord_1", {
      carrier: "aras", trackingCode: "  ", shipmentId: null, labelUrl: null,
    })).rejects.toThrow(/kod/i);
  });

  it("tanınmayan taşıyıcıyı reddeder", async () => {
    await expect(recordShipment(deps(), "ord_1", {
      carrier: "dhl" as never, trackingCode: "1", shipmentId: null, labelUrl: null,
    })).rejects.toThrow(/taşıyıcı/i);
  });

  it("DB hatasında Supabase mesajını taşır ([object Object] değil)", async () => {
    const supabase = fakeSupabase({}, { message: "duplicate key" });
    await expect(recordShipment(deps(supabase), "ord_1", {
      carrier: "aras", trackingCode: "1234567890", shipmentId: null, labelUrl: null,
    })).rejects.toThrow(/duplicate key/);
  });

  it("manuel kayıtta shipment_id/label_url patch'e hiç konmaz", async () => {
    const supabase = fakeSupabase();
    await recordShipment(deps(supabase), "ord_1", {
      carrier: "aras", trackingCode: "1234567890", shipmentId: null, labelUrl: null,
    });
    const patch = supabase.updates.find(u => u.table === "orders")!;
    expect(patch).not.toHaveProperty("shipment_id");
    expect(patch).not.toHaveProperty("label_url");
  });
});

/** Sipariş + adres + kalemleri okumayı taklit eden sahte istemci.
 *  `eq()` hem `await` edilebilir (order_items dizisi) hem `single()` taşır (tek satır). */
function fakeSupabaseForDispatch(over: {
  order?: Record<string, unknown>;
  address?: Record<string, unknown>;
  items?: Record<string, unknown>[];
} = {}) {
  const order = {
    id: "ord_1", total: 429.9, paymentMethod: "credit_card",
    addressId: "a1", userId: "u1", shipment_id: null, ...over.order,
  };
  const address = {
    fullName: "Ayşe Yılmaz", phone: "05551112233", address: "Atatürk Cd. No:5",
    city: "İstanbul", district: "Kadıköy", city_code: "34", ...over.address,
  };
  const items = over.items ?? [{
    quantity: 2,
    product: { name: "10×15 Baskı (12'li)", length_cm: 20, width_cm: 15, height_cm: 2, weight_kg: 0.3 },
  }];
  const profile = { email: "m@example.com", fullName: "Ayşe", phone: "05551112233" };
  const updates: Record<string, unknown>[] = [];

  const rowFor = (table: string) =>
    table === "orders" ? order : table === "addresses" ? address : profile;

  return {
    updates,
    from(table: string) {
      return {
        update(patch: Record<string, unknown>) {
          updates.push({ table, ...patch });
          return { eq: async () => ({ error: null }) };
        },
        select() {
          return {
            eq: () =>
              Object.assign(
                Promise.resolve({ data: table === "order_items" ? items : [rowFor(table)] }),
                { single: async () => ({ data: rowFor(table) }) },
              ),
          };
        },
      };
    },
  };
}

function fakeProvider(over: Partial<CarrierProvider> = {}): CarrierProvider {
  return {
    id: "aras",
    createShipment: vi.fn(async () => ({
      carrier: "aras" as const, shipmentId: "ARAS-1",
      trackingCode: "TRK-1", labelUrl: "https://x/l.pdf",
    })),
    getStatus: vi.fn(async () => "IN_TRANSIT" as const),
    ...over,
  };
}

describe("dispatchOrder", () => {
  it("sağlayıcı yoksa UNSUPPORTED hatası verir", async () => {
    await expect(dispatchOrder(deps(), "ord_1", null)).rejects.toThrow(/manuel/i);
  });

  it("sağlayıcıya gönderi oluşturtur ve sonucu kaydeder", async () => {
    const supabase = fakeSupabaseForDispatch();
    const d = { ...deps(), supabase: supabase as never };
    const provider = fakeProvider();

    await dispatchOrder(d, "ord_1", provider);

    expect(provider.createShipment).toHaveBeenCalledOnce();
    expect(supabase.updates[0]).toMatchObject({
      carrier: "aras", trackingCode: "TRK-1",
      shipment_id: "ARAS-1", status: "SHIPPED",
    });
  });

  it("eksik ölçü varsa sağlayıcıya HİÇ gitmez", async () => {
    const supabase = fakeSupabaseForDispatch({
      items: [{ quantity: 1, product: { name: "50×70 Kanvas", length_cm: null, width_cm: null, height_cm: null, weight_kg: null } }],
    });
    const provider = fakeProvider();
    await expect(
      dispatchOrder({ ...deps(), supabase: supabase as never }, "ord_1", provider),
    ).rejects.toThrow(/50×70 Kanvas/);
    expect(provider.createShipment).not.toHaveBeenCalled();
  });

  it("gönderisi zaten oluşmuş siparişi ikinci kez göndermez (idempotency)", async () => {
    const supabase = fakeSupabaseForDispatch({ order: { shipment_id: "ARAS-1" } });
    const provider = fakeProvider();
    await expect(
      dispatchOrder({ ...deps(), supabase: supabase as never }, "ord_1", provider),
    ).rejects.toThrow(/zaten/i);
    expect(provider.createShipment).not.toHaveBeenCalled();
  });
});
