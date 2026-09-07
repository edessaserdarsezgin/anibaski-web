import { describe, it, expect } from "vitest";
import { isKnownCarrier, carrierName, trackingUrl, CARRIER_OPTIONS } from "./registry";

describe("isKnownCarrier", () => {
  it("tanınan kimlikler için true", () => {
    expect(isKnownCarrier("aras")).toBe(true);
    expect(isKnownCarrier("yurtici")).toBe(true);
    expect(isKnownCarrier("other")).toBe(true);
  });

  it("tanınmayan kimlik için false", () => {
    expect(isKnownCarrier("dhl")).toBe(false);
    expect(isKnownCarrier("")).toBe(false);
  });
});

describe("carrierName", () => {
  it("görünen adı döner", () => {
    expect(carrierName("aras")).toBe("Aras Kargo");
    expect(carrierName("other")).toBe("Diğer");
  });
});

describe("trackingUrl", () => {
  it("takip kodunu URL'e gömer", () => {
    expect(trackingUrl("aras", "1234567890")).toContain("1234567890");
    expect(trackingUrl("aras", "1234567890")).toMatch(/^https:\/\//);
  });

  it("kodu URL-encode eder", () => {
    expect(trackingUrl("yurtici", "AB 12/34")).not.toContain(" ");
  });

  it("takip URL'i olmayan taşıyıcı için null döner", () => {
    expect(trackingUrl("other", "123")).toBeNull();
  });

  it("boş kod için null döner", () => {
    expect(trackingUrl("aras", "  ")).toBeNull();
  });
});

describe("CARRIER_OPTIONS", () => {
  it("CustomSelect için value/label çiftleri üretir", () => {
    expect(CARRIER_OPTIONS.find(o => o.value === "aras")?.label).toBe("Aras Kargo");
  });

  it("'Diğer' seçeneği listenin sonundadır", () => {
    expect(CARRIER_OPTIONS[CARRIER_OPTIONS.length - 1].value).toBe("other");
  });
});
