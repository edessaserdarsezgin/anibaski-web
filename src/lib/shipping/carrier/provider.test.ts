import { describe, it, expect, afterEach } from "vitest";
import { getCarrierProvider, CarrierError } from "./provider";

const original = process.env.SHIPPING_CARRIER;
afterEach(() => {
  if (original === undefined) delete process.env.SHIPPING_CARRIER;
  else process.env.SHIPPING_CARRIER = original;
});

describe("getCarrierProvider", () => {
  it("env tanımsızsa null döner (manuel mod)", () => {
    delete process.env.SHIPPING_CARRIER;
    expect(getCarrierProvider()).toBeNull();
  });

  it("manuel değeri açıkça yazıldığında da null döner", () => {
    process.env.SHIPPING_CARRIER = "manual";
    expect(getCarrierProvider()).toBeNull();
  });

  it("adaptörü yazılmamış bir taşıyıcı istendiğinde null döner", () => {
    process.env.SHIPPING_CARRIER = "aras";
    expect(getCarrierProvider()).toBeNull();
  });
});

describe("CarrierError", () => {
  it("kodu ve mesajı taşır", () => {
    const err = new CarrierError("VALIDATION", "Adreste il plaka kodu yok");
    expect(err.code).toBe("VALIDATION");
    expect(err.message).toBe("Adreste il plaka kodu yok");
    expect(err).toBeInstanceOf(Error);
  });

  it("adı sınıf adıyla aynıdır (log okunabilirliği)", () => {
    expect(new CarrierError("CARRIER", "x").name).toBe("CarrierError");
  });
});
