import { describe, it, expect } from "vitest";
import {
  volumetricDesi, billableDesi, tariffDesi, orderDesi,
  hasDimensions, parseDimensionsInput,
} from "./desi";

const kanvas = { length: 50, width: 70, height: 5, weight: 1.2 };   // 5.83 desi
// hacimsel 0.2 ama ağırlık 0.3 → FATURALANAN 0.3 (billableDesi ikisinin BÜYÜĞÜNÜ alır)
const foto12 = { length: 20, width: 15, height: 2, weight: 0.3 };

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

describe("orderDesi — konsolide koli (kalem desileri TOPLANMAZ)", () => {
  // Sektör kuralı: çok kalemli siparişte desi, kalem desilerinin toplamından değil
  // BİRLEŞTİRİLMİŞ kolinin dış ölçüsünden hesaplanır. Toplama, her ürünün etrafındaki
  // boş havayı da toplar ve sistematik olarak fazla desi üretir.
  it("tek kalemde ürünü kurtaran en küçük standart kutuyu seçer", () => {
    const r = orderDesi([{ dimensions: foto12, quantity: 1 }]);
    // 20×15×2 = 600 cm³ + %15 tolerans = 690 → S kutu (3000 cm³ = 1 desi)
    expect(r.box).toBe("S");
    expect(r.desi).toBe(1);
    expect(r.missingCount).toBe(0);
  });

  it("adet arttıkça desiyi TOPLAMAZ — aynı kutuda kaldığı sürece desi sabit", () => {
    // Düz baskı: hafif, ağırlık devreye girmesin ki kutu etkisi izole görünsün
    const hafif = { length: 20, width: 15, height: 2, weight: 0.05 };
    const bir = orderDesi([{ dimensions: hafif, quantity: 1 }]);
    const dort = orderDesi([{ dimensions: hafif, quantity: 4 }]); // 2400 cm³ + %15 = 2760 < 3000
    expect(dort.desi).toBe(bir.desi);
    expect(dort.box).toBe("S");
    // ESKİ (hatalı) davranış kalem desilerini toplardı: 0.2×4 + 0.5 = 1.3 desi çıkardı
    expect(dort.desi).toBe(1);
  });

  it("hacim büyüyünce bir üst kutuya geçer", () => {
    const r = orderDesi([{ dimensions: foto12, quantity: 10 }]); // 6000 + %15 = 6900 → M (9000 cm³)
    expect(r.box).toBe("M");
    expect(r.desi).toBe(3);
  });

  it("ağırlık hacimden büyükse ağırlık kazanır (ücretlendirilebilir ağırlık)", () => {
    const agir = { length: 10, width: 10, height: 10, weight: 5 }; // 1000 cm³ ama 5 kg
    const r = orderDesi([{ dimensions: agir, quantity: 1 }]);
    expect(r.desi).toBe(5); // S kutu 1 desi olsa da ağırlık 5
    expect(r.tariffDesi).toBe(5);
  });

  it("ağırlık adetle TOPLANIR (hacmin aksine fiziksel olarak toplanabilir)", () => {
    const agir = { length: 10, width: 10, height: 10, weight: 5 };
    expect(orderDesi([{ dimensions: agir, quantity: 2 }]).desi).toBe(10);
  });

  it("en büyük kutuyu aşan sipariş bölünür ve koli desileri TOPLANIR", () => {
    // XL = 60×40×40 = 96000 cm³. İki XL dolduracak hacim → 2 koli
    const dev = { length: 60, width: 40, height: 40, weight: 1 };
    const r = orderDesi([{ dimensions: dev, quantity: 2 }]);
    expect(r.parcelCount).toBe(3); // 192000 × 1.15 = 220800 → 3 koli
    expect(r.box).toBe("XL");
    expect(r.desi).toBe(96); // 3 × 32
  });

  it("ölçüsüz kalemi hesaba katmaz ama raporlar", () => {
    const r = orderDesi([
      { dimensions: foto12, quantity: 1 },
      { dimensions: null, quantity: 3 },
    ]);
    expect(r.missingCount).toBe(1);
    expect(r.desi).toBe(1);
  });

  it("hiç ölçülü kalem yoksa 0 döner — kutu seçmez", () => {
    expect(orderDesi([{ dimensions: null, quantity: 1 }]))
      .toEqual({ desi: 0, tariffDesi: 0, box: null, parcelCount: 0, missingCount: 1 });
  });
});

describe("orderDesi — faturalanacak tarife desisi", () => {
  // Taşıyıcı tam desi bandından ücretlendirir ve 1 desinin ALTI da 1 desi sayılır.
  it("1 desi altındaki siparişi 1 desi sayar", () => {
    const kucuk = { length: 5, width: 5, height: 1, weight: 0.02 }; // 25 cm³
    expect(orderDesi([{ dimensions: kucuk, quantity: 1 }]).tariffDesi).toBe(1);
  });

  it("küsuratı yukarı yuvarlar", () => {
    const agir = { length: 10, width: 10, height: 10, weight: 1.2 };
    const r = orderDesi([{ dimensions: agir, quantity: 3 }]); // ağırlık 3.6 > kutu desisi
    expect(r.desi).toBe(3.6);
    expect(r.tariffDesi).toBe(4);
  });

  it("hiç ölçü yoksa 1 desi UYDURMAZ — 0 döner (bilmiyoruz demek)", () => {
    expect(orderDesi([{ dimensions: null, quantity: 2 }]).tariffDesi).toBe(0);
  });

  it("büyük format tek kalemde bandı aşar", () => {
    // kanvas 50×70×5 = 17500 cm³ + %15 = 20125 → L (24000 cm³ = 8 desi)
    const r = orderDesi([{ dimensions: kanvas, quantity: 1 }]);
    expect(r.box).toBe("L");
    expect(r.tariffDesi).toBe(8);
  });
});
