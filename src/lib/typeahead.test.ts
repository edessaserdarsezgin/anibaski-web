import { describe, it, expect } from "vitest";
import { typeaheadStep, TYPEAHEAD_RESET_MS } from "./typeahead";

const iller = [
  { label: "İl seçin", disabled: true },
  { label: "Adana" }, { label: "Ankara" }, { label: "Antalya" },
  { label: "İstanbul" }, { label: "İzmir" }, { label: "Isparta" },
];
const fresh = { text: "", at: 0 };

/** Kısaltma: tek tuş bas, sonucu döndür. */
function press(key: string, activeIdx: number, prev = fresh, now = 1000) {
  return typeaheadStep({ options: iller, activeIdx, key, now, prev });
}

describe("typeaheadStep — tek harf", () => {
  it("harfle başlayan ilk seçeneğe atlar", () => {
    expect(press("a", -1).index).toBe(1); // Adana
  });

  it("Türkçe duyarlı eşleşir: 'i' → İstanbul", () => {
    expect(press("i", -1).index).toBe(4); // İstanbul
  });

  it("büyük harf de aynı sonucu verir", () => {
    expect(press("A", -1).index).toBe(1);
  });

  it("devre dışı seçeneği atlar", () => {
    // "İl seçin" disabled; 'i' onu değil İstanbul'u bulmalı
    expect(press("i", -1).index).toBe(4);
  });

  it("eşleşme yoksa null döner ve konum korunur", () => {
    expect(press("z", 2).index).toBeNull();
  });
});

describe("typeaheadStep — aynı harfe tekrar basma (döngü)", () => {
  it("aynı harfle başlayan seçenekler arasında ilerler", () => {
    const first = press("a", -1);
    expect(first.index).toBe(1); // Adana
    const second = press("a", 1, first.state, 1100);
    expect(second.index).toBe(2); // Ankara
    const third = press("a", 2, second.state, 1200);
    expect(third.index).toBe(3); // Antalya
  });

  it("son eşleşmeden sonra başa sarar", () => {
    const r = press("a", 3, { text: "a", at: 900 }, 1000);
    expect(r.index).toBe(1); // Antalya'dan sonra tekrar Adana
  });

  it("'i' döngüsü Türkçe I/İ ayrımını yok sayar", () => {
    const first = press("i", -1);
    expect(first.index).toBe(4); // İstanbul
    const second = press("i", 4, first.state, 1100);
    expect(second.index).toBe(5); // İzmir
    const third = press("i", 5, second.state, 1200);
    expect(third.index).toBe(6); // Isparta
  });
});

describe("typeaheadStep — çok harfli arama", () => {
  it("biriken harflerle daraltır", () => {
    const a = press("a", -1);
    const an = press("n", a.index!, a.state, 1100);
    expect(an.state.text).toBe("an");
    expect(an.index).toBe(2); // Ankara
    const ant = press("t", an.index!, an.state, 1200);
    expect(ant.index).toBe(3); // Antalya
  });

  it("çok harfli aramada baştan arar, döngü yapmaz", () => {
    const r = typeaheadStep({
      options: iller, activeIdx: 5, key: "d", now: 1100, prev: { text: "a", at: 1000 },
    });
    expect(r.state.text).toBe("ad");
    expect(r.index).toBe(1); // Adana — aktif indeksin gerisinde olmasına rağmen bulunur
  });
});

describe("typeaheadStep — tampon sıfırlama", () => {
  it(`${TYPEAHEAD_RESET_MS} ms sonra tampon sıfırlanır`, () => {
    const a = press("a", -1, fresh, 1000);
    const late = press("n", 1, a.state, 1000 + TYPEAHEAD_RESET_MS + 1);
    expect(late.state.text).toBe("n"); // "an" değil
  });

  it("süre içindeyse tampon birikir", () => {
    const a = press("a", -1, fresh, 1000);
    const soon = press("n", 1, a.state, 1000 + TYPEAHEAD_RESET_MS - 1);
    expect(soon.state.text).toBe("an");
  });
});
