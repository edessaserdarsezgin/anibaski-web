import { describe, it, expect } from "vitest";
import { resolveAddressLocation } from "./addressLocation";

describe("resolveAddressLocation — geçerli girdi", () => {
  it("kod ve ilçeyi olduğu gibi kabul eder", () => {
    const r = resolveAddressLocation({ city: "Ankara", cityCode: "06", district: "Altındağ" });
    expect(r).toEqual({ ok: true, city_code: "06", district: "Altındağ" });
  });

  it("ilçeyi resmî yazıma normalize eder", () => {
    const r = resolveAddressLocation({ city: "Ankara", cityCode: "06", district: "altındağ" });
    expect(r.ok && r.district).toBe("Altındağ");
  });

  it("kod gelmezse il adından türetir (eski istemci)", () => {
    const r = resolveAddressLocation({ city: "İstanbul", cityCode: "", district: "kadikoy" });
    expect(r).toEqual({ ok: true, city_code: "34", district: "Kadıköy" });
  });
});

describe("resolveAddressLocation — reddedilen girdi", () => {
  it("tanınmayan il", () => {
    const r = resolveAddressLocation({ city: "Atlantis", cityCode: "", district: "Merkez" });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/il/i);
  });

  it("o ilde bulunmayan ilçe", () => {
    const r = resolveAddressLocation({ city: "İstanbul", cityCode: "34", district: "Keçiören" });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/ilçe/i);
  });

  it("boş ilçe", () => {
    const r = resolveAddressLocation({ city: "Ankara", cityCode: "06", district: "  " });
    expect(r.ok).toBe(false);
  });

  it("eksik alanlar", () => {
    expect(resolveAddressLocation({ city: "", cityCode: "", district: "Altındağ" }).ok).toBe(false);
    expect(resolveAddressLocation({ city: null, cityCode: null, district: null }).ok).toBe(false);
  });
});
