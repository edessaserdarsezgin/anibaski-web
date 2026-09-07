import { describe, it, expect } from "vitest";
import { cityCodeFromName, cityNameFromCode, CITIES, CITY_OPTIONS } from "./cities";

describe("cityCodeFromName", () => {
  it("büyük/küçük harf ve Türkçe İ farkını yok sayar", () => {
    expect(cityCodeFromName("İstanbul")).toBe("34");
    expect(cityCodeFromName("istanbul")).toBe("34");
    expect(cityCodeFromName("ISTANBUL")).toBe("34");
  });

  it("halk arasındaki eski/kısa adları tanır", () => {
    expect(cityCodeFromName("Antep")).toBe("27");
    expect(cityCodeFromName("İçel")).toBe("33");
    expect(cityCodeFromName("Urfa")).toBe("63");
  });

  it("tanınmayan ad ve boş girdi için null döner", () => {
    expect(cityCodeFromName("Atlantis")).toBeNull();
    expect(cityCodeFromName(null)).toBeNull();
  });
});

describe("cityNameFromCode", () => {
  it("baştaki sıfırı tamamlar", () => {
    expect(cityNameFromCode("6")).toBe("Ankara");
    expect(cityNameFromCode("06")).toBe("Ankara");
  });

  it("geçersiz kod için null döner", () => {
    expect(cityNameFromCode("99")).toBeNull();
  });
});

describe("CITIES", () => {
  it("81 il içerir ve kodlar benzersizdir", () => {
    expect(CITIES).toHaveLength(81);
    expect(new Set(CITIES.map(c => c.code)).size).toBe(81);
  });

  it("CITY_OPTIONS Türkçe alfabetik sıralıdır", () => {
    expect(CITY_OPTIONS[0].label).toBe("Adana");
  });
});
