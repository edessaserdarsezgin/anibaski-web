// Üretken düzenleme motoru. Qwen-Image-Edit-2511 (LoRA preset'leri) — kendi ZeroGPU Space'i.
// AuraSR (aiUpscale.ts) saf büyütme; bu motor LoRA'ya göre stilize/iyileştirme yapar.
import { Client } from "@gradio/client";

const SPACE = process.env.HF_EDIT_SPACE; // örn. "serdarsezgin/Qwen-Image-Edit-2511-LoRAs-Fast"
const TOKEN = process.env.HF_TOKEN;      // PRO token (AuraSR ile ortak)

// Efekt slug → { Space'teki LoRA görünen adı, sabit prompt }. Yeni kart eklemek = buraya satır.
type EditPreset = { lora: string; prompt: string };
export const EDIT_PRESETS: Record<string, EditPreset> = {
  unblur:   { lora: "Unblur-Anything",          prompt: "Unblur and upscale." },
  portrait: { lora: "Hyper-Realistic-Portrait", prompt: "Transform into a hyper-realistic face portrait." },
  anime:    { lora: "Photo-to-Anime",           prompt: "Transform into anime." },
  pixar:    { lora: "Pixar-Inspired-3D",        prompt: "Transform it into Pixar-inspired 3D." },
};

/** Görseli seçilen preset'le düzenler, sonuç görselinin byte'larını döndürür. */
export async function callQwenEdit(input: Buffer, presetSlug: string): Promise<Buffer> {
  if (!SPACE || !TOKEN) throw new Error("Düzenleme yapılandırması eksik (HF_EDIT_SPACE/HF_TOKEN)");
  const preset = EDIT_PRESETS[presetSlug];
  if (!preset) throw new Error("Geçersiz efekt");

  const client = await Client.connect(SPACE, { token: TOKEN as `hf_${string}` });
  // Space images_b64_json bekliyor: base64 data URL'lerin JSON dizisi (b64_to_pil_list).
  const dataUrl = `data:image/jpeg;base64,${input.toString("base64")}`;
  const result = await client.predict("/infer", {
    images_b64_json: JSON.stringify([dataUrl]),
    prompt: preset.prompt,
    lora_adapter: preset.lora,
    seed: 0,
    randomize_seed: true,
    guidance_scale: 1,
    steps: 4,
  });

  // Çıktı: [0] = sonuç görseli (FileData url), [1] = slider değeri.
  const data = result.data as Array<{ url?: string } | null>;
  const out = data?.[0];
  if (!out?.url) throw new Error("Düzenleme sonucu alınamadı");

  const res = await fetch(out.url);
  if (!res.ok) throw new Error("Sonuç görseli indirilemedi");
  return Buffer.from(await res.arrayBuffer());
}
