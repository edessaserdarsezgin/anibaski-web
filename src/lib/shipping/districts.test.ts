import { describe, it, expect } from "vitest";
import { DISTRICTS, districtsOf, normalizeDistrict, districtOptions } from "./districts";

describe("DISTRICTS veri bütünlüğü", () => {
  it("81 ilin tamamını içerir", () => {
    expect(Object.keys(DISTRICTS)).toHaveLength(81);
  });

  it("toplam 973 ilçe içerir", () => {
    const total = Object.values(DISTRICTS).reduce((s, d) => s + d.length, 0);
    expect(total).toBe(973);
  });

  it("anahtarlar iki haneli plaka kodudur", () => {
    for (const code of Object.keys(DISTRICTS)) {
      expect(code).toMatch(/^\d{2}$/);
    }
  });

  it("bilinen il ilçe sayıları tutuyor", () => {
    expect(DISTRICTS["34"]).toHaveLength(39); // İstanbul
    expect(DISTRICTS["06"]).toHaveLength(25); // Ankara
    expect(DISTRICTS["01"]).toHaveLength(15); // Adana
  });

  it("adlar Türkçe başlık biçiminde (TÜMÜ BÜYÜK değil)", () => {
    expect(DISTRICTS["34"]).toContain("Kadıköy");
    expect(DISTRICTS["06"]).toContain("Altındağ");
    expect(DISTRICTS["06"]).toContain("Keçiören");
    // Türkçe I/İ tuzağı: "İMAMOĞLU" → "İmamoğlu", "ISPARTA" ili değil ilçesi vb.
    expect(DISTRICTS["01"]).toContain("İmamoğlu");
  });

  it("her il içinde ilçe adları benzersiz ve alfabetik sıralı", () => {
    for (const [code, list] of Object.entries(DISTRICTS)) {
      expect(new Set(list).size, `${code} yinelenen ilçe`).toBe(list.length);
      const sorted = [...list].sort((a, b) => a.localeCompare(b, "tr"));
      expect(list, `${code} sıralı değil`).toEqual(sorted);
    }
  });
});

describe("districtsOf", () => {
  it("plaka kodunun ilçelerini döner", () => {
    expect(districtsOf("34")).toContain("Beşiktaş");
  });

  it("baştaki sıfırı tamamlar", () => {
    expect(districtsOf("6")).toEqual(districtsOf("06"));
  });

  it("geçersiz/boş kod için boş dizi döner", () => {
    expect(districtsOf("99")).toEqual([]);
    expect(districtsOf(null)).toEqual([]);
    expect(districtsOf("")).toEqual([]);
  });
});

describe("normalizeDistrict", () => {
  it("serbest metni resmî yazıma eşler", () => {
    expect(normalizeDistrict("06", "altındağ")).toBe("Altındağ");
    expect(normalizeDistrict("06", "ALTINDAĞ")).toBe("Altındağ");
    expect(normalizeDistrict("06", "  Keçiören  ")).toBe("Keçiören");
  });

  it("Türkçe aksan ve İ/ı farkını yok sayar", () => {
    expect(normalizeDistrict("34", "kadikoy")).toBe("Kadıköy");
    expect(normalizeDistrict("34", "BESIKTAS")).toBe("Beşiktaş");
  });

  it("o ilde olmayan ilçe için null döner", () => {
    expect(normalizeDistrict("34", "Keçiören")).toBeNull(); // Ankara ilçesi
  });

  it("boş girdi ve geçersiz il için null döner", () => {
    expect(normalizeDistrict("06", "")).toBeNull();
    expect(normalizeDistrict(null, "Altındağ")).toBeNull();
    expect(normalizeDistrict("99", "Altındağ")).toBeNull();
  });
});

describe("districtOptions", () => {
  it("CustomSelect için value/label çiftleri üretir", () => {
    const opts = districtOptions("06");
    expect(opts[0]).toEqual({ value: "Akyurt", label: "Akyurt" });
  });

  it("il seçilmemişse boş liste döner", () => {
    expect(districtOptions("")).toEqual([]);
  });
});
