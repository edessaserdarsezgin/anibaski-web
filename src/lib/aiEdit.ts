// Üretken düzenleme motoru. Qwen-Image-Edit-2511 (LoRA preset'leri) — kendi ZeroGPU Space'i.
// AuraSR (aiUpscale.ts) saf büyütme; bu motor LoRA'ya göre stilize/iyileştirme yapar.
// LoRA + prompt artık admin'den (studio_tools tablosu) gelir; burada motor mantığı izole.
import { Client } from "@gradio/client";

const SPACE = process.env.HF_EDIT_SPACE; // örn. "serdarsezgin/Qwen-Image-Edit-2511-LoRAs-Fast"
const TOKEN = process.env.HF_TOKEN;      // PRO token (AuraSR ile ortak)

/** Görseli verilen LoRA + prompt ile düzenler, sonuç görselinin byte'larını döndürür. */
export async function callQwenEdit(input: Buffer, lora: string, prompt: string): Promise<Buffer> {
  if (!SPACE || !TOKEN) throw new Error("Düzenleme yapılandırması eksik (HF_EDIT_SPACE/HF_TOKEN)");

  const client = await Client.connect(SPACE, { token: TOKEN as `hf_${string}` });
  // Space images_b64_json bekliyor: base64 data URL'lerin JSON dizisi (b64_to_pil_list).
  const dataUrl = `data:image/jpeg;base64,${input.toString("base64")}`;
  const result = await client.predict("/infer", {
    images_b64_json: JSON.stringify([dataUrl]),
    prompt,
    lora_adapter: lora,
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

// Space'in LoRA dropdown listesi — admin formundaki seçim için. Süreçte değişmez, memoize edilir.
let loraCache: { at: number; list: string[] } | null = null;
const LORA_TTL = 10 * 60_000; // 10 dk

/** Space'teki kullanılabilir LoRA adaptör adları (admin dropdown'u için). */
export async function getEditLoras(): Promise<string[]> {
  if (!SPACE || !TOKEN) return [];
  if (loraCache && Date.now() - loraCache.at < LORA_TTL) return loraCache.list;

  const client = await Client.connect(SPACE, { token: TOKEN as `hf_${string}` });
  const comps = (client.config?.components ?? []) as Array<{ type?: string; props?: { choices?: unknown[] } }>;
  // En uzun choices dizisine sahip dropdown LoRA listesidir.
  const dropdown = comps
    .filter((c) => c.type === "dropdown" && Array.isArray(c.props?.choices))
    .sort((a, b) => (b.props!.choices!.length) - (a.props!.choices!.length))[0];
  const list = (dropdown?.props?.choices ?? []).map((ch) =>
    Array.isArray(ch) ? String(ch[0]) : String(ch)
  );
  loraCache = { at: Date.now(), list };
  return list;
}
