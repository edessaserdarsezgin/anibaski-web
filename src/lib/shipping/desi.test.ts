import { describe, it, expect } from "vitest";
import {
  volumetricDesi, billableDesi, tariffDesi, orderDesi,
  hasDimensions, parseDimensionsInput, PACKAGING_DESI_MARGIN,
} from "./desi";

const kanvas = { length: 50, width: 70, height: 5, weight: 1.2 };   // 5.83 desi
const foto12 = { length: 20, width: 15, height: 2, weight: 0.3 };   // 0.2 desi

describe("volumetricDesi", () => {
  it("hacmi 3000'e böler", () => {
    expect(volumetricDesi(kanvas)).toBe(5.83);
  });
});

describe("billableDesi", () => {
  it("hacimsel desi ağırlıktan büyükse hacmi kullanır", () => {
    expect(billableDesi(kanvas)).toBe(5.83);
  });

  it("ağırlık hacimsel desiden büyükse ağırlığı kullanır", () => {
    expect(billableDesi({ length: 10, width: 10, height: 10, weight: 2 })).toBe(2);
  });
});

describe("tariffDesi", () => {
  it("tarife bandı için yukarı yuvarlar", () => {
    expect(tariffDesi(kanvas)).toBe(6);
  });

  it("en az 1 desi döner", () => {
    expect(tariffDesi(foto12)).toBe(1);
  });
});

describe("hasDimensions", () => {
  it("tüm alanlar doluysa true", () => {
    expect(hasDimensions({ length_cm: 20, width_cm: 15, height_cm: 2, weight_kg: 0.3 })).toBe(true);
  });

  it("tek alan bile boşsa false", () => {
    expect(hasDimensions({ length_cm: 20, width_cm: 15, height_cm: null, weight_kg: 0.3 })).toBe(false);
  });

  it("sıfır geçerli ölçü değildir", () => {
    expect(hasDimensions({ length_cm: 0, width_cm: 15, height_cm: 2, weight_kg: 0.3 })).toBe(false);
  });
});

describe("parseDimensionsInput", () => {
  it("boş string ve sıfırı null'a çevirir", () => {
    expect(parseDimensionsInput({ length_cm: "", width_cm: 0, height_cm: "2", weight_kg: -1 }))
      .toEqual({ length_cm: null, width_cm: null, height_cm: 2, weight_kg: null });
  });
});

describe("orderDesi", () => {
  it("kalem desilerini adetle çarpıp ambalaj payı ekler", () => {
    const r = orderDesi([{ dimensions: foto12, quantity: 2 }]);
    expect(r.desi).toBe(0.2 * 2 + PACKAGING_DESI_MARGIN);
    expect(r.missingCount).toBe(0);
  });

  it("ölçüsüz kalemi toplama katmaz ama raporlar", () => {
    const r = orderDesi([
      { dimensions: foto12, quantity: 1 },
      { dimensions: null, quantity: 3 },
    ]);
    expect(r.missingCount).toBe(1);
    expect(r.desi).toBe(0.2 + PACKAGING_DESI_MARGIN);
  });

  it("hiç ölçülü kalem yoksa ambalaj payı eklemez", () => {
    expect(orderDesi([{ dimensions: null, quantity: 1 }])).toEqual({ desi: 0, missingCount: 1 });
  });
});
