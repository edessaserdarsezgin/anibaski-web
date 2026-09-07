import { describe, it, expect } from "vitest";
import { trKey } from "./text";

describe("trKey", () => {
  it("büyük/küçük harf farkını siler", () => {
    expect(trKey("İSTANBUL")).toBe(trKey("istanbul"));
    expect(trKey("Kadıköy")).toBe(trKey("KADIKÖY"));
  });

  it("Türkçe İ/I/ı ayrımını tek harfe indirger", () => {
    expect(trKey("İzmir")).toBe("izmir");
    expect(trKey("Isparta")).toBe("isparta");
    expect(trKey("Iğdır")).toBe("igdir");
  });

  it("aksanlı harfleri ASCII karşılığına indirger", () => {
    expect(trKey("Şanlıurfa")).toBe("sanliurfa");
    expect(trKey("Çankırı")).toBe("cankiri");
    expect(trKey("Muğla")).toBe("mugla");
    expect(trKey("Gümüşhane")).toBe("gumushane");
    expect(trKey("Elazığ")).toBe("elazig");
  });

  it("boşluk, nokta, tire ve alt çizgiyi atar", () => {
    expect(trKey("Afyon Karahisar")).toBe("afyonkarahisar");
    expect(trKey("K.Maraş")).toBe("kmaras");
    expect(trKey("Şereflikoç-hisar")).toBe("sereflikochisar");
  });

  it("JS'in bilinen 'İ'.toLowerCase() birleşik nokta tuzağına düşmez", () => {
    // "İSTANBUL".toLowerCase() → "i̇stanbul" (i + birleşen nokta) — doğrudan karşılaştırma başarısız olur
    expect(trKey("İstanbul")).toBe("istanbul");
    expect(trKey("İstanbul").length).toBe("istanbul".length);
  });

  it("boş girdiyi boş döner", () => {
    expect(trKey("")).toBe("");
    expect(trKey("   ")).toBe("");
  });
});
