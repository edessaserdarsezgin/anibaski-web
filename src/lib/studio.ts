// AI Stüdyo araç tipi. Araç listesi artık DB'den (studio_tools) gelir:
// - galeri/sayfa: GET /api/ai/studio/tools
// - admin yönetimi: /admin/ai-araclar
// - çekirdek lib: lib/studioTools.ts
export type StudioTool = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
  engine?: "upscale" | "edit" | null; // "upscale" → AuraSR, "edit" → Qwen LoRA
  generative?: boolean;               // üretken AI — "yapay zeka değiştirebilir" uyarısı
};
