import { describe, it, expect, vi } from "vitest";
import { recordShipment } from "./dispatch";
import type { EmailPayload } from "./dispatch";

/** orders güncellemesini ve profil/adres okumalarını taklit eden asgari sahte istemci. */
function fakeSupabase(order: Record<string, unknown> = {}) {
  const updates: Record<string, unknown>[] = [];
  const client = {
    updates,
    from(table: string) {
      return {
        update(patch: Record<string, unknown>) {
          updates.push({ table, ...patch });
          return { eq: async () => ({ error: null }) };
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
});
