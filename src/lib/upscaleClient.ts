// Motor izolasyon noktası. Faz A: sunucu route'u (/api/ai/studio/upscale) → AuraSR.
// Eski tarayıcı UpscalerJS motoru kaldırıldı.

/** Hata kodu taşıyan upscale hatası (sayfa 401/429 ayrımı için). */
export class UpscaleError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
  }
}

// Vercel serverless istek gövdesi limiti ~4.5MB; büyük foto → 413. Yüklemeden önce
// tarayıcıda en uzun kenarı 2000px'e indir (sunucu zaten 2000'e indiriyor, kalite kaybı yok)
// + EXIF yönünü uygula (imageOrientation), böylece sonuç yan/ters çıkmaz.
async function downscaleForUpload(file: File, maxEdge = 2000): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    // Zaten küçük + limit altındaysa dokunma (server EXIF'i .rotate ile uygular)
    if (scale === 1 && file.size < 4_000_000) { bitmap.close(); return file; }
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close(); return file; }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
    );
    return blob ?? file;
  } catch {
    return file; // küçültme başarısızsa orijinali gönder
  }
}

/**
 * Fotoğrafı sunucuya gönderip 4x upscale sonucunu object URL olarak döndürür.
 * 401 → giriş gerekli, 429 → günlük kota doldu.
 */
export async function upscaleViaServer(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", await downscaleForUpload(file), "upload.jpg");

  const res = await fetch("/api/ai/studio/upscale", { method: "POST", body: fd });

  if (!res.ok) {
    if (res.status === 401) throw new UpscaleError("Giriş gerekli", 401);
    if (res.status === 429) throw new UpscaleError("Kredin doldu", 429);
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
 * Fotoğrafı seçilen efektle (slug) düzenler (Qwen-Image-Edit), sonucu object URL döndürür.
 * 401 → giriş gerekli, 429 → kredi doldu.
 */
export async function editViaServer(file: File, slug: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", await downscaleForUpload(file), "upload.jpg");
  fd.append("slug", slug);

  const res = await fetch("/api/ai/studio/edit", { method: "POST", body: fd });

  if (!res.ok) {
    if (res.status === 401) throw new UpscaleError("Giriş gerekli", 401);
    if (res.status === 429) throw new UpscaleError("Kredin doldu", 429);
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
