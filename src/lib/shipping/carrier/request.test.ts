import { describe, it, expect } from "vitest";
import { buildShipmentRequest } from "./request";
import { PACKAGING_DESI_MARGIN } from "../desi";

// hacimsel 0.2, ağırlık 0.3 → faturalanan 0.3
const dims = { length_cm: 20, width_cm: 15, height_cm: 2, weight_kg: 0.3 };
const bosDims = { length_cm: null, width_cm: null, height_cm: null, weight_kg: null };

function input(over: Partial<Parameters<typeof buildShipmentRequest>[0]> = {}) {
  return {
    order: { id: "ord_1", total: 429.9, paymentMethod: "credit_card" },
    address: {
      fullName: "Ayşe Yılmaz", phone: "0555 111 22 33",
      address: "Atatürk Cd. No:5 D:3", city: "İstanbul", district: "Kadıköy",
      city_code: "34",
    },
    items: [{ productName: "10×15 Fotoğraf Baskı (12'li)", quantity: 2, dimensions: dims }],
    ...over,
  };
}

describe("buildShipmentRequest — başarılı kurulum", () => {
  it("alıcı bilgilerini adresten eşler", () => {
    const r = buildShipmentRequest(input());
    if (!r.ok) throw new Error("başarılı olmalıydı: " + r.missing.join(", "));
    expect(r.request.receiver).toEqual({
      name: "Ayşe Yılmaz",
      phone: "0555 111 22 33",
      address: "Atatürk Cd. No:5 D:3",
      cityCode: "34",
      cityName: "İstanbul",
      townName: "Kadıköy",
    });
  });

  it("orderRef olarak sipariş kimliğini kullanır (idempotency çapası)", () => {
    const r = buildShipmentRequest(input());
    if (!r.ok) throw new Error("başarılı olmalıydı");
    expect(r.request.orderRef).toBe("ord_1");
  });

  it("desiyi adetle çarpar ve ambalaj payını ekler", () => {
    const r = buildShipmentRequest(input());
    if (!r.ok) throw new Error("başarılı olmalıydı");
    expect(r.request.parcel.desi).toBe(0.3 * 2 + PACKAGING_DESI_MARGIN);
    expect(r.request.parcel.pieceCount).toBe(1);
  });

  it("il adını plaka kodundan resmî biçimde üretir", () => {
    const r = buildShipmentRequest(input({
      address: { ...input().address, city: "istanbul", city_code: "34" },
    }));
    if (!r.ok) throw new Error("başarılı olmalıydı");
    expect(r.request.receiver.cityName).toBe("İstanbul");
  });
});

describe("buildShipmentRequest — kapıda ödeme", () => {
  it("cod siparişinde tahsil tutarı siparişin toplamıdır", () => {
    const r = buildShipmentRequest(input({
      order: { id: "ord_2", total: 429.9, paymentMethod: "cod" },
    }));
    if (!r.ok) throw new Error("başarılı olmalıydı");
    expect(r.request.cod).toEqual({ amount: 429.9 });
  });

  it("kartla ödenmiş siparişte cod null'dır", () => {
    const r = buildShipmentRequest(input());
    if (!r.ok) throw new Error("başarılı olmalıydı");
    expect(r.request.cod).toBeNull();
  });
});

describe("buildShipmentRequest — eksik veri", () => {
  it("ölçüsü girilmemiş ürünü adıyla raporlar", () => {
    const r = buildShipmentRequest(input({
      items: [{ productName: "50×70 Kanvas", quantity: 1, dimensions: bosDims }],
    }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.missing.some(m => m.includes("50×70 Kanvas"))).toBe(true);
  });

  it("il plaka kodu yoksa raporlar", () => {
    const r = buildShipmentRequest(input({
      address: { ...input().address, city_code: null },
    }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.missing.some(m => m.includes("plaka"))).toBe(true);
  });

  it("birden çok eksiği aynı anda toplar", () => {
    const r = buildShipmentRequest(input({
      address: { ...input().address, city_code: null, phone: "  " },
      items: [{ productName: "50×70 Kanvas", quantity: 1, dimensions: bosDims }],
    }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.missing.length).toBeGreaterThanOrEqual(3);
  });

  it("hiç kalem yoksa gönderi kurmaz", () => {
    const r = buildShipmentRequest(input({ items: [] }));
    expect(r.ok).toBe(false);
  });
});
