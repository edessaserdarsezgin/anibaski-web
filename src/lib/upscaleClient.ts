// Motor izolasyon noktası. Faz 1: UpscalerJS (TensorFlow.js, ESRGAN) — tarayıcıda.
// Sağlayıcı/motor değiştirmek = yalnız bu dosyayı değiştirmek.

const MAX_INPUT_EDGE = 1000; // bellek guard'ı: çok büyük girdiyi önce küçült (4x → maks ~4000px)

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Görsel yüklenemedi"));
    img.src = src;
  });
}

/**
 * Verilen fotoğrafı tarayıcıda büyütür. base64 data URL döndürür.
 * upscaler + model yalnız ilk çağrıda lazy yüklenir.
 */
export async function upscaleInBrowser(file: File): Promise<string> {
  const [{ default: Upscaler }, { default: model }] = await Promise.all([
    import("upscaler"),
    import("@upscalerjs/esrgan-medium/4x"),
  ]);

  const srcUrl = URL.createObjectURL(file);
  const upscaler = new Upscaler({ model });
  try {
    const img = await loadImage(srcUrl);
    const maxEdge = Math.max(img.naturalWidth, img.naturalHeight);

    let inputSrc = srcUrl;
    if (maxEdge > MAX_INPUT_EDGE) {
      const scale = MAX_INPUT_EDGE / maxEdge;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas desteklenmiyor");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      inputSrc = canvas.toDataURL("image/jpeg", 0.95);
    }

    // patchSize: büyük görsellerde UI'yi kilitlemez
    return await upscaler.upscale(inputSrc, { patchSize: 64, padding: 5 });
  } finally {
    URL.revokeObjectURL(srcUrl);
    // modeli + tensörleri GPU'dan serbest bırak (bellek birikmesini önler)
    await upscaler.dispose();
  }
}
