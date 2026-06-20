import type { Metadata } from "next";
import Link from "next/link";
import { getShippingSettings } from "@/lib/shipping";
import HomeCategoryRows from "@/components/home/HomeCategoryRows";
import FeaturedStrip from "@/components/home/FeaturedStrip";
import HeroBanner from "@/components/home/HeroBanner";
import CampaignTiles from "@/components/home/CampaignTiles";
import ReprintStrip from "@/components/home/ReprintStrip";
import RecentlyViewed from "@/components/home/RecentlyViewed";
import TestimonialsStrip from "@/components/home/TestimonialsStrip";
import AIStudioPromo from "@/components/home/AIStudioPromo";
import AIStudioPrintOptions from "@/components/home/AIStudioPrintOptions";
import { createClient } from "@/lib/supabase/server";
import {
  getHomeCategories,
  getCategoryProductsForHome,
  getFeaturedProducts,
  getHeroBanners,
  getCampaignCards,
  getReprintSuggestions
} from "@/lib/catalog";

export const metadata: Metadata = {
  title: "AnıBaskı | Anılarınızı Dokunulur Kılın",
  description:
    "Fotoğraf baskısı, fotokitap, tablo ve polaroid ile dijital anılarınızı kalıcı hediyelere dönüştürün. 2-5 iş günü teslimat, Türkiye geneli kargo.",
  openGraph: {
    title: "AnıBaskı | Anılarınızı Dokunulur Kılın",
    description:
      "Fotoğraf baskısı, fotokitap, tablo ve polaroid ile dijital anılarınızı kalıcı hediyelere dönüştürün.",
    url: "/",
  },
};

export default async function HomePage() {
  const { freeShippingThreshold } = await getShippingSettings();

  const [homeCats, featRaw, bannerRaw, campaignCards] = await Promise.all([
    getHomeCategories(),
    getFeaturedProducts(12),
    getHeroBanners(),
    getCampaignCards(),
  ]);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const reprint = user ? await getReprintSuggestions(user.id, 8) : [];

  type CatRowProduct = { id: string; name: string; slug: string; basePrice: number; images: string[] | null; discount_percent: number | null; discount_starts_at: string | null; discount_ends_at: string | null; productTags?: { tagId: string; position: string; tag: { name: string; color: string } }[] | null };
  let catRows: { id: string; name: string; slug: string; products: CatRowProduct[] }[] = [];
  if (homeCats && homeCats.length > 0) {
    const ids = homeCats.map((c) => c.id);
    const prods = await getCategoryProductsForHome(ids);
    const prodsList = (prods ?? []) as unknown as (CatRowProduct & { categoryId: string })[];
    catRows = homeCats.map((c) => ({
      id: c.id, name: c.name, slug: c.slug,
      products: prodsList.filter((p) => p.categoryId === c.id).slice(0, 8),
    }));
  }

  const featured = (featRaw ?? []) as unknown as Parameters<typeof FeaturedStrip>[0]["products"];

  const nowIso = new Date().toISOString();
  const heroBanners = (bannerRaw ?? []).filter(
    (b) => (!b.starts_at || b.starts_at <= nowIso) && (!b.ends_at || b.ends_at >= nowIso)
  );

  return (
    <>
      <style>{`
        .cat-large:hover .cat-icon { transform: scale(1.15); opacity: 0.5; }
        .cat-large .cat-icon { transition: transform 0.5s ease, opacity 0.5s ease; }
      `}</style>

      <div className="overflow-hidden">

        {/* 1. Hero Banner — admin'den yönetilen dinamik banner (placement='hero') */}
        <h1 className="sr-only">AnıBaskı — Fotoğraf Baskısı, Fotokitap, Tablo ve Polaroid</h1>
        <HeroBanner banners={heroBanners} />

        {/* 2. Güven Şeridi — hero'nun hemen altında */}
        <section className="py-10 px-8 bg-primary">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: "🚚", title: "Ücretsiz Kargo", desc: `${freeShippingThreshold} ₺ ve üzeri siparişlerde` },
              { icon: "🔒", title: "Güvenli Ödeme", desc: "256-bit SSL şifreleme" },
              { icon: "🎁", title: "Özel Paketleme", desc: "Hediyeye hazır kutularda" },
              { icon: "↩️", title: "Memnuniyet Garantisi", desc: "Sorun varsa yeniden basıyoruz" },
            ].map((t) => (
              <div key={t.title} className="flex items-center gap-3">
                <span className="text-2xl shrink-0">{t.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{t.title}</p>
                  <p className="text-xs text-white/65">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Kampanya kartları */}
        <CampaignTiles cards={campaignCards} />

        {/* 4. Kategoriler */}
        <section className="py-24 px-4 sm:px-8 bg-bg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-2">Koleksiyonlar</p>
                <h2 className="font-serif text-3xl md:text-5xl text-text">Ne yapmak istersiniz?</h2>
              </div>
              <Link href="/urunler" className="hidden md:block text-sm font-semibold text-text-light hover:text-primary transition-colors">
                Tümünü gör →
              </Link>
            </div>

            {catRows.length > 0 ? (
              <HomeCategoryRows rows={catRows} />
            ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-4 lg:h-[480px]">
              <Link href="/kategoriler/fotograf-baskilari"
                className="cat-large group col-span-2 lg:row-span-2 relative overflow-hidden rounded-3xl bg-primary flex flex-col justify-end p-8 min-h-[280px] hover:shadow-hover transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-t from-text/50 via-text/10 to-transparent" />
                <span className="cat-icon absolute top-6 right-6 text-[5rem] opacity-30">🖼️</span>
                <div className="relative">
                  <h3 className="font-serif text-3xl text-white mb-2">Fotoğraf Baskıları</h3>
                  <p className="text-white/75 text-sm mb-5 max-w-xs">Anılarınızı en net ve canlı haliyle kağıda dökün. Fujifilm kalitesi.</p>
                  <span className="inline-flex items-center gap-2 text-white text-sm font-semibold group-hover:gap-3 transition-all">
                    Keşfet <span aria-hidden>→</span>
                  </span>
                </div>
              </Link>
              {[
                { title: "Duvar Dekorasyonu", desc: "Evinizi sanata dönüştürün.", slug: "duvar-dekorasyonu", icon: "🏠", bg: "bg-amber-50" },
                { title: "Albümler ve Kitaplar", desc: "Hikayenizi sayfalarca anlatın.", slug: "albumler-ve-kitaplar", icon: "📖", bg: "bg-emerald-50" },
                { title: "Kişiye Özel Hediyeler", desc: "Sevdiklerinizi şaşırtın.", slug: "kisiye-ozel-hediyeler", icon: "🎁", bg: "bg-violet-50" },
              ].map((cat) => (
                <Link key={cat.slug} href={`/kategoriler/${cat.slug}`}
                  className={`group relative overflow-hidden rounded-3xl ${cat.bg} flex flex-col justify-between p-6 hover:shadow-hover transition-all duration-300 hover:-translate-y-1`}>
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300 inline-block">{cat.icon}</span>
                  <div>
                    <h3 className="font-serif text-base text-text mb-1 group-hover:text-primary transition-colors">{cat.title}</h3>
                    <p className="text-xs text-text-light leading-relaxed hidden lg:block">{cat.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
            )}
          </div>
        </section>

        {/* 5. AI Stüdyo tanıtımı */}
        <AIStudioPromo />

        {/* 6. AI Stüdyo → baskı seçenekleri */}
        <AIStudioPrintOptions />

        {/* 7. Öne çıkan ürünler */}
        <FeaturedStrip products={featured} />

        {/* 8. Tekrar Bas + Son baktıkların */}
        <ReprintStrip products={reprint as unknown as Parameters<typeof ReprintStrip>[0]["products"]} />
        <RecentlyViewed />

        {/* 9. Nasıl Çalışır */}
        <section className="py-28 px-8 bg-white border-y border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20">
              <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-4">Süreç</p>
              <h2 className="font-serif text-3xl md:text-5xl text-text">Üç adımda tamamdır</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
              <div className="hidden md:block absolute top-[2.6rem] left-[calc(16.66%+2.75rem)] right-[calc(16.66%+2.75rem)] border-t-2 border-dashed border-border" />
              {[
                { num: "01", icon: "📸", title: "Fotoğrafını Yükle", desc: "Telefonundan ya da bilgisayarından istediğin fotoğrafı saniyeler içinde yükle." },
                { num: "02", icon: "🎨", title: "Ürünü Özelleştir", desc: "Boyut, kağıt kalitesi ve çerçeve seçeneklerini dilediğince belirle." },
                { num: "03", icon: "📦", title: "Kapında Olsun", desc: "2–5 iş günü içinde özenle paketlenmiş ürününü teslim alırsın." },
              ].map((s) => (
                <div key={s.num} className="flex flex-col items-center text-center px-8 gap-5 relative z-10">
                  <div className="w-[5.5rem] h-[5.5rem] rounded-2xl bg-bg border border-border shadow-soft flex flex-col items-center justify-center gap-1">
                    <span className="text-[2rem]">{s.icon}</span>
                    <span className="font-mono text-[9px] text-text-light tracking-[0.2em]">{s.num}</span>
                  </div>
                  <h3 className="font-serif text-xl text-text">{s.title}</h3>
                  <p className="text-sm text-text-light leading-relaxed max-w-[200px]">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. Müşteri Yorumları */}
        <TestimonialsStrip />

        {/* 11. Son CTA */}
        <section className="relative py-36 px-8 bg-text overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-[350px] h-[350px] rounded-full bg-accent/15 blur-3xl" />
          </div>
          <div className="relative max-w-2xl mx-auto text-center flex flex-col items-center gap-8">
            <h2 className="font-serif text-4xl md:text-6xl text-white leading-tight">
              Bir anınızı{" "}
              <em className="not-italic text-accent">hayata</em>{" "}
              geçirin
            </h2>
            <p className="text-white/55 text-lg max-w-sm leading-relaxed">
              İlk siparişinizde ücretsiz kargo. Hesap oluşturmak 30 saniye sürer.
            </p>
            <Link
              href="/urunler"
              className="px-12 py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 text-lg"
            >
              Ürünleri Keşfet
            </Link>
          </div>
        </section>

      </div>
    </>
  );
}
