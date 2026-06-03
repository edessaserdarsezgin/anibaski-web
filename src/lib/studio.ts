export type StudioTool = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
  engine?: "upscale" | "edit"; // hangi sunucu motoru çağrılır (varsayılan: upscale)
  generative?: boolean;        // üretken AI — "yapay zeka değiştirebilir" uyarısı gösterilir
};

// Galeride gösterilen araçlar. Aktif olanlar bir motora bağlı:
// - "upscale" → AuraSR (saf 4x büyütme)
// - "edit"    → Qwen-Image-Edit LoRA preset'i (slug, edit route'unda prompt/lora'ya eşlenir)
// Pasif olanlar vizyonu göstermek için "Yakında" kilitli görünür.
export const STUDIO_TOOLS: StudioTool[] = [
  { slug: "upscale",  name: "Netleştir & Büyüt",  description: "Düşük çözünürlüklü fotoğrafı baskıya uygun hale getir", icon: "✨", active: true,  engine: "upscale" },
  { slug: "unblur",   name: "Bulanıklığı Gider",  description: "Bulanık veya titrek fotoğrafı netleştir",              icon: "🔍", active: true,  engine: "edit", generative: true },
  { slug: "portrait", name: "Portreni Güçlendir", description: "Portreni hiper-gerçekçi, net bir hale getir",          icon: "👤", active: true,  engine: "edit", generative: true },
  { slug: "anime",    name: "Anime'ye Çevir",     description: "Fotoğrafını anime tarzına dönüştür",                   icon: "🎴", active: true,  engine: "edit", generative: true },
  { slug: "pixar",    name: "Pixar 3D Karakter",  description: "Fotoğrafını Pixar tarzı 3D karaktere çevir",           icon: "🧸", active: true,  engine: "edit", generative: true },
  { slug: "colorize", name: "Renklendir",         description: "Siyah-beyaz fotoğrafı renklendir",                     icon: "🎨", active: false },
  { slug: "background",name: "Arka Plan",         description: "Arka planı kaldır veya değiştir",                      icon: "🪄", active: false },
  { slug: "retouch",  name: "Rötuş",              description: "Cilt, ışık ve renk otomatik düzeltme",                 icon: "💫", active: false },
];
