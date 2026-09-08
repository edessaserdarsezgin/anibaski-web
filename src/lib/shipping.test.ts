import { describe, it, expect } from "vitest";
import { parseShippingSettings, ShippingSettingsError, SHIPPING_TEXT_DEFAULTS } from "./shipping";

const row = {
  shipping_fee: "69.90",
  free_shipping_threshold: "750",
  cod_fee: "49.90",
  production_time: "2–3 iş günü",
  shipping_time: "1–3 iş günü",
  order_cutoff_note: "14:00'a kadar",
  dispatch_cutoff_hour: 14,
  dispatch_business_days: 0,
  ramazan_start: null,
  ramazan_end: null,
  kurban_start: null,
  kurban_end: null,
  extra_holidays: null,
};

describe("parseShippingSettings — parasal alanlar", () => {
  it("numeric kolonların string gelmesini sayıya çevirir", () => {
    const s = parseShippingSettings(row);
    expect(s.shippingFee).toBe(69.9);
    expect(s.freeShippingThreshold).toBe(750);
    expect(s.codFee).toBe(49.9);
  });

  it("satır yoksa hata fırlatır — sessiz varsayılana düşmez", () => {
    expect(() => parseShippingSettings(null)).toThrow(ShippingSettingsError);
  });

  for (const [field, bad] of [
    ["shipping_fee", null],
    ["free_shipping_threshold", undefined],
    ["cod_fee", ""],
    ["shipping_fee", "abc"],
    ["cod_fee", -1],
  ] as const) {
    it(`${field}=${JSON.stringify(bad)} geçersiz sayılır (0'a düşmez)`, () => {
      expect(() => parseShippingSettings({ ...row, [field]: bad })).toThrow(ShippingSettingsError);
    });
  }

  it("kargo ücreti 0 geçerlidir (kampanyayla tümüyle ücretsiz kargo)", () => {
    expect(parseShippingSettings({ ...row, shipping_fee: 0 }).shippingFee).toBe(0);
  });
});

describe("parseShippingSettings — metin alanları", () => {
  it("boş metinlerde varsayılana düşer (parasal etkisi yok)", () => {
    const s = parseShippingSettings({ ...row, production_time: "   ", dispatch_cutoff_hour: null });
    expect(s.productionTime).toBe(SHIPPING_TEXT_DEFAULTS.productionTime);
    expect(s.dispatchCutoffHour).toBe(SHIPPING_TEXT_DEFAULTS.dispatchCutoffHour);
  });

  it("bayram aralıklarını ve serbest tatilleri tek listede birleştirir", () => {
    const s = parseShippingSettings({
      ...row,
      ramazan_start: "2026-03-19",
      ramazan_end: "2026-03-21",
      extra_holidays: "2026-01-01\n2026-03-20",
    });
    expect(s.extraHolidays.split("\n")).toEqual(["2026-01-01", "2026-03-19", "2026-03-20", "2026-03-21"]);
  });
});
