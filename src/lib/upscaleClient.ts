// Motor izolasyon noktası. Faz A: sunucu route'u (/api/ai/studio/upscale) → AuraSR.
// Eski tarayıcı UpscalerJS motoru kaldırıldı.

/** Hata kodu taşıyan upscale hatası (sayfa 401/429 ayrımı için). */
export class UpscaleError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
  }
}

/**
 * Fotoğrafı sunucuya gönderip 4x upscale sonucunu object URL olarak döndürür.
 * 401 → giriş gerekli, 429 → günlük kota doldu.
 */
export async function upscaleViaServer(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/ai/studio/upscale", { method: "POST", body: fd });

  if (!res.ok) {
    if (res.status === 401) throw new UpscaleError("Giriş gerekli", 401);
    if (res.status === 429) throw new UpscaleError("Günlük 5 ücretsiz hakkın doldu", 429);
    let msg = "İşlem başarısız";
    try {
      const d = await res.json();
      if (typeof d?.error === "string") msg = d.error;
    } catch {
      // gövde JSON değilse varsayılan mesaj
    }
    throw new UpscaleError(msg);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * Fotoğrafı seçilen efekt preset'iyle düzenler (Qwen-Image-Edit), sonucu object URL döndürür.
 * 401 → giriş gerekli, 429 → günlük kota doldu.
 */
export async function editViaServer(file: File, preset: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("preset", preset);

  const res = await fetch("/api/ai/studio/edit", { method: "POST", body: fd });

  if (!res.ok) {
    if (res.status === 401) throw new UpscaleError("Giriş gerekli", 401);
    if (res.status === 429) throw new UpscaleError("Günlük 5 ücretsiz hakkın doldu", 429);
    let msg = "İşlem başarısız";
    try {
      const d = await res.json();
      if (typeof d?.error === "string") msg = d.error;
    } catch {
      // gövde JSON değilse varsayılan mesaj
    }
    throw new UpscaleError(msg);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
