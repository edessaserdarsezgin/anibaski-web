// Sağlayıcı izolasyon noktası. Faz A: kendi ZeroGPU AuraSR-v2 Space'i (@gradio/client).
// Faz B'de fal.ai'ye geçince YALNIZ bu dosya değişir; arayüz (Buffer→Buffer) sabit.
import { Client } from "@gradio/client";

const SPACE = process.env.HF_UPSCALE_SPACE;     // örn. "serdarsezgin/AuraSR-v2"
const TOKEN = process.env.HF_TOKEN;             // PRO token, "hf_..."

/** Girdi görselini 4x upscale eder, sonuç görselinin byte'larını döndürür. */
export async function callAuraSpace(input: Buffer): Promise<Buffer> {
  if (!SPACE || !TOKEN) throw new Error("Upscale yapılandırması eksik (HF_UPSCALE_SPACE/HF_TOKEN)");

  const client = await Client.connect(SPACE, { token: TOKEN as `hf_${string}` });
  const blob = new Blob([new Uint8Array(input)], { type: "image/jpeg" });
  const result = await client.predict("/process_image", { input_image: blob });

  // AuraSR-v2 çıktısı: ImageSlider → iç içe [[before, after]]. after = data[0][1], FileData(url).
  const data = result.data as Array<Array<{ url?: string } | null>>;
  const after = data?.[0]?.[1];
  if (!after?.url) throw new Error("Upscale sonucu alınamadı");

  const res = await fetch(after.url);
  if (!res.ok) throw new Error("Upscale görseli indirilemedi");
  return Buffer.from(await res.arrayBuffer());
}
