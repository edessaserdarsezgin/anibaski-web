import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";

export type SeoSettings = {
  siteName: string;
  defaultDescription: string;
  defaultOgImage: string;
  googleVerification: string;
  bingVerification: string;
};

export type SeoPage = { title: string; description: string; ogImage: string };

export type PageRegistryEntry = {
  path: string;
  label: string;
  defaultTitle: string; // KISA (ana sayfa hariç); kök şablon " | siteName" ekler
  defaultDescription: string;
};

export const SEO_DEFAULTS: SeoSettings = {
  siteName: "AnıBaskı",
  defaultDescription:
    "Dijital anılarınızı fotoğraf baskısı, fotokitap, tablo ve kişisel hediyelere dönüştürün. Türkiye'nin en hızlı fotoğraf baskı platformu.",
  defaultOgImage: "",
  googleVerification: "",
  bingVerification: "",
};

export const PAGE_REGISTRY: PageRegistryEntry[] = [
  { path: "/", label: "Ana Sayfa", defaultTitle: "AnıBaskı | Anılarınızı Dokunulur Kılın", defaultDescription: "Dijital anılarınızı fotoğraf baskısı, fotokitap, tablo ve kişisel hediyelere dönüştürün. Türkiye'nin en hızlı fotoğraf baskı platformu." },
  { path: "/urunler", label: "Ürünler", defaultTitle: "Tüm Ürünler", defaultDescription: "Fotoğraf baskısı, fotokitap, tablo, polaroid ve daha fazlası. Tüm ürünleri keşfedin, anılarınızı kalıcı hediyelere dönüştürün." },
  { path: "/koleksiyonlar", label: "Koleksiyonlar", defaultTitle: "Koleksiyonlar", defaultDescription: "Özenle derlenmiş ürün koleksiyonları: temalara göre seçilmiş fotoğraf baskısı ve hediye fikirleri." },
  { path: "/studyo", label: "AI Stüdyo", defaultTitle: "AI Stüdyo", defaultDescription: "Fotoğraflarınızı yapay zeka ile iyileştirin, netleştirin ve baskıya hazırlayın." },
  { path: "/urun-rehberi", label: "Baskı Rehberi", defaultTitle: "Baskı Rehberi", defaultDescription: "En iyi baskı sonucu için fotoğraf çekim ve hazırlama ipuçları, ürün seçim rehberi." },
  { path: "/kampanyalar", label: "Kampanyalar", defaultTitle: "Kampanyalar", defaultDescription: "AnıBaskı'nın güncel kampanyaları, indirim fırsatları ve özel teklifleri." },
  { path: "/sss", label: "Sıkça Sorulan Sorular", defaultTitle: "Sıkça Sorulan Sorular", defaultDescription: "Sipariş, ödeme, kargo, baskı kalitesi ve iade hakkında sık sorulan sorular." },
  { path: "/iletisim", label: "İletişim", defaultTitle: "İletişim", defaultDescription: "AnıBaskı ile iletişime geçin; sorularınız ve destek için buradayız." },
  { path: "/teslimat", label: "Teslimat", defaultTitle: "Teslimat", defaultDescription: "Kargo süreleri, teslimat koşulları ve sipariş takibi hakkında bilgi." },
  { path: "/kvkk", label: "KVKK Aydınlatma Metni", defaultTitle: "KVKK Aydınlatma Metni", defaultDescription: "Kişisel verilerin korunması kapsamında aydınlatma metni." },
  { path: "/politikalar/gizlilik", label: "Gizlilik Politikası", defaultTitle: "Gizlilik Politikası", defaultDescription: "AnıBaskı gizlilik politikası ve kişisel veri işleme esasları." },
  { path: "/politikalar/kullanim-kosullari", label: "Kullanım Koşulları", defaultTitle: "Kullanım Koşulları", defaultDescription: "AnıBaskı web sitesi kullanım koşulları." },
  { path: "/politikalar/mesafeli-satis-sozlesmesi", label: "Mesafeli Satış Sözleşmesi", defaultTitle: "Mesafeli Satış Sözleşmesi", defaultDescription: "Mesafeli satış sözleşmesi koşulları." },
  { path: "/politikalar/iptal-iade", label: "İptal ve İade", defaultTitle: "İptal ve İade Politikası", defaultDescription: "Sipariş iptali, cayma hakkı ve iade koşulları." },
];

export async function getSeoSettings(): Promise<SeoSettings> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("site_settings").select("data").eq("id", 1).single();
    return { ...SEO_DEFAULTS, ...((data?.data as Partial<SeoSettings>) ?? {}) };
  } catch {
    return SEO_DEFAULTS;
  }
}

export async function getAllSeoPages(): Promise<Record<string, SeoPage>> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("seo_pages").select("path, title, description, og_image");
    const map: Record<string, SeoPage> = {};
    for (const r of data ?? []) {
      map[r.path as string] = {
        title: (r.title as string) ?? "",
        description: (r.description as string) ?? "",
        ogImage: (r.og_image as string) ?? "",
      };
    }
    return map;
  } catch {
    return {};
  }
}

export async function getSeoPage(path: string): Promise<SeoPage | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("seo_pages")
      .select("title, description, og_image")
      .eq("path", path)
      .maybeSingle();
    if (!data) return null;
    return {
      title: (data.title as string) ?? "",
      description: (data.description as string) ?? "",
      ogImage: (data.og_image as string) ?? "",
    };
  } catch {
    return null;
  }
}

/** Sabit sayfalar (ana sayfa HARİÇ) için metadata üretir.
 *  Düz string title döndürür → kök layout şablonu " | siteName" ekler. */
export async function pageMetadata(path: string): Promise<Metadata> {
  const [override, settings] = await Promise.all([getSeoPage(path), getSeoSettings()]);
  const reg = PAGE_REGISTRY.find((p) => p.path === path);
  const title = (override?.title || reg?.defaultTitle || settings.siteName).trim();
  const description = (override?.description || reg?.defaultDescription || settings.defaultDescription).trim();
  const ogImage = override?.ogImage || settings.defaultOgImage;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}
