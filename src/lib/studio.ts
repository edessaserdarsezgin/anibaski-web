export type StudioTool = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
};

// Galeride gösterilen araçlar. Faz 1'de yalnız "upscale" aktif;
// diğerleri vizyonu göstermek için "Yakında" kilitli görünür.
export const STUDIO_TOOLS: StudioTool[] = [
  { slug: "upscale",    name: "Netleştir & Büyüt", description: "Düşük çözünürlüklü fotoğrafı baskıya uygun hale getir", icon: "✨", active: true },
  { slug: "restore",    name: "Eski Fotoğraf Onar", description: "Çizik, leke ve solmayı gider",            icon: "🩹", active: false },
  { slug: "colorize",   name: "Renklendir",        description: "Siyah-beyaz fotoğrafı renklendir",         icon: "🎨", active: false },
  { slug: "background", name: "Arka Plan",         description: "Arka planı kaldır veya değiştir",          icon: "🪄", active: false },
  { slug: "retouch",    name: "Rötuş",             description: "Cilt, ışık ve renk otomatik düzeltme",     icon: "💫", active: false },
];
