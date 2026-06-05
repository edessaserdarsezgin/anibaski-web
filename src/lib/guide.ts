// src/lib/guide.ts — Baskı Rehberi senaryo→ürün eşlemesi (statik konfig).
export type GuideRef = {
  icon: string; // emoji
  scenario: string; // kart başlığı
  blurb: string; // kısa açıklama
  slug: string; // hedef ürün slug (DB'den canlı çözülür)
  categorySlug: string; // ürün pasif/yoksa fallback /kategoriler/{slug}
};

export const GUIDE_NEEDS: GuideRef[] = [
  {
    icon: "📸",
    scenario: "Telefondaki onlarca anıyı elinde tut",
    blurb: "Galerinde biriken kareleri klasik fotoğraf baskısıyla albüme, panoya, cüzdana taşı.",
    slug: "foto-baski",
    categorySlug: "klasik-baskilar",
  },
  {
    icon: "📖",
    scenario: "Hikâyeni bir albümde anlat",
    blurb: "Tatil, düğün ya da bebek anılarını sayfa sayfa akan bir foto kitapta topla.",
    slug: "foto-kitap-20x30",
    categorySlug: "albumler-ve-kitaplar",
  },
  {
    icon: "🖼️",
    scenario: "Tek özel kareyi duvara as",
    blurb: "En sevdiğin fotoğrafı kanvas tabloyla salonuna taşı; mat dokulu, çerçevesiz şıklık.",
    slug: "30x40-kanvas-tablo",
    categorySlug: "kanvas-tablolar",
  },
  {
    icon: "🎞️",
    scenario: "Retro, asılası kareler",
    blurb: "Polaroid tarzı mini baskılarla pano, mantel ya da buzdolabı için nostaljik bir köşe kur.",
    slug: "polaroid-seti-10lu",
    categorySlug: "polo-kart-baskilar",
  },
  {
    icon: "🪟",
    scenario: "Masana çerçeveli tek kare",
    blurb: "Sevdiklerinin fotoğrafını hazır çerçevesiyle masana ya da rafına koy.",
    slug: "10x15-cerceve",
    categorySlug: "cerceveler",
  },
  {
    icon: "🧲",
    scenario: "Buzdolabına küçük dokunuşlar",
    blurb: "Magnet baskılarla en sevdiğin anları her gün gözünün önünde tut.",
    slug: "magnet-baski-9-adet",
    categorySlug: "magnetler",
  },
];

export const GUIDE_GIFTS: GuideRef[] = [
  {
    icon: "☕",
    scenario: "Pratik & kişisel hediye",
    blurb: "Fotoğraflı kupa; her sabah hatırlatan, bütçe dostu ve her zaman işe yarayan bir hediye.",
    slug: "fotografli-kupa",
    categorySlug: "kupalar",
  },
  {
    icon: "🏡",
    scenario: "Şık duvar hediyesi",
    blurb: "Kanvas tablo; yeni ev, yıldönümü ya da aile fotoğrafı için iddialı bir seçim.",
    slug: "30x40-kanvas-tablo",
    categorySlug: "kanvas-tablolar",
  },
  {
    icon: "💝",
    scenario: "Sevgili / genç hediyesi",
    blurb: "Polaroid seti; birlikte çekilen kareleri elle tutulur küçük bir sürprize çevir.",
    slug: "polaroid-seti-10lu",
    categorySlug: "polo-kart-baskilar",
  },
  {
    icon: "📚",
    scenario: "Yıldönümü / anı hediyesi",
    blurb: "Foto kitap; bir yılın ya da bir ilişkinin hikâyesini hediye edilebilir bir albüme sığdır.",
    slug: "foto-kitap-20x30",
    categorySlug: "albumler-ve-kitaplar",
  },
];
