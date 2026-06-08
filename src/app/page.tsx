import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import Link from "next/link";
import { getShippingSettings } from "@/lib/shipping";
import { createAdminClient } from "@/lib/supabase/server";
import HomeCategoryRows from "@/components/home/HomeCategoryRows";
import FeaturedStrip from "@/components/home/FeaturedStrip";
import HeroBanner from "@/components/home/HeroBanner";

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

  const homeDb = createAdminClient();
  const { data: homeCats } = await homeDb
    .from("categories").select("id, name, slug").eq("show_on_home", true).order("home_position", { ascending: true });
  let catRows: { id: string; name: string; slug: string; products: { id: string; name: string; slug: string; basePrice: number; images: string[] | null; discount_percent: number | null; discount_starts_at: string | null; discount_ends_at: string | null }[] }[] = [];
  if (homeCats && homeCats.length > 0) {
    const ids = homeCats.map((c) => c.id);
    const { data: prods } = await homeDb
      .from("products_with_order_count")
      .select("id, name, slug, basePrice, images, categoryId, discount_percent, discount_starts_at, discount_ends_at")
      .in("categoryId", ids).eq("isActive", true).order("createdAt", { ascending: false });
    catRows = homeCats.map((c) => ({
      id: c.id, name: c.name, slug: c.slug,
      products: (prods ?? []).filter((p) => p.categoryId === c.id).slice(0, 8),
    }));
  }

  const { data: featRaw } = await homeDb
    .from("products_with_order_count")
    .select("id, name, slug, basePrice, images, discount_percent, discount_starts_at, discount_ends_at")
    .eq("is_featured", true).eq("isActive", true)
    .order("featured_position", { ascending: true }).order("createdAt", { ascending: false })
    .limit(12);
  const featured = featRaw ?? [];

  const nowIso = new Date().toISOString();
  const { data: bannerRaw } = await homeDb
    .from("campaigns")
    .select("id, image_url, title, subtitle, cta_text, cta_url, starts_at, ends_at")
    .eq("show_on_home", true).eq("is_active", true)
    .order("position", { ascending: true });
  const heroBanners = (bannerRaw ?? []).filter(
    (b) => (!b.starts_at || b.starts_at <= nowIso) && (!b.ends_at || b.ends_at >= nowIso)
  );

  return (
    <>
      <style>{`
        @keyframes gentleFloat {
          0%, 100% { transform: rotate(-5deg) translateY(0px); }
          50%       { transform: rotate(-5deg) translateY(-12px); }
        }
        @keyframes gentleFloat2 {
          0%, 100% { transform: rotate(9deg) translateY(0px); }
          50%       { transform: rotate(9deg) translateY(-7px); }
        }
        @keyframes gentleFloat3 {
          0%, 100% { transform: rotate(-1deg) translateY(0px); }
          50%       { transform: rotate(-1deg) translateY(-9px); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .pol-1 { animation: gentleFloat  5s ease-in-out infinite; }
        .pol-2 { animation: gentleFloat2 6.5s ease-in-out infinite 0.8s; }
        .pol-3 { animation: gentleFloat3 4.8s ease-in-out infinite 0.3s; }
        .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
        .cat-large:hover .cat-icon { transform: scale(1.15); opacity: 0.5; }
        .cat-large .cat-icon { transition: transform 0.5s ease, opacity 0.5s ease; }
      `}</style>

      <AnnouncementBanner />
      <Header />
      <main className="overflow-hidden">

        <HeroBanner banners={heroBanners} />

        {/* ── Hero ──────────────────────────────────────── */}
        <section className="relative min-h-[92vh] flex items-center bg-bg">
          {/* Warm gradient blobs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-[560px] h-[560px] rounded-full bg-primary/8 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[380px] h-[380px] rounded-full bg-accent/18 blur-3xl" />
          </div>

          <div className="relative max-w-6xl mx-auto px-8 py-24 w-full grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-16 items-center">

            {/* Left — copy */}
            <div className="flex flex-col gap-8">
              {/* Trust badge */}
              <div className="inline-flex items-center gap-2.5 self-start px-4 py-2 rounded-full border border-primary/25 bg-primary/8 text-primary text-xs font-semibold">
                <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                Türkiye geneli hızlı teslimat · 50.000+ mutlu müşteri
              </div>

              {/* Headline */}
              <h1 className="font-serif text-[clamp(3rem,8vw,5.5rem)] text-text leading-[1.04] tracking-tight">
                Dijital<br />
                <em className="not-italic text-primary">anılarınızı</em>
                <br />
                <span className="relative inline-block">
                  dokunulur
                  <svg
                    className="absolute -bottom-1.5 left-0 w-full overflow-visible"
                    viewBox="0 0 280 10" fill="none" preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4 7 C60 2, 130 2, 200 5 C240 7, 265 5, 276 3"
                      stroke="#f2cc8f" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>{" "}kılın.
              </h1>

              <p className="text-text-light text-lg leading-relaxed max-w-md">
                Telefonunuzda kalan kareler; baskıya, kitaba ve tabloya dönüşüyor.
                Özenle paketlenip kapınıza geliyor.
              </p>

              {/* CTAs */}
              <div className="flex gap-4 flex-wrap">
                <Link
                  href="/urunler"
                  className="px-9 py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-all shadow-soft hover:shadow-hover hover:-translate-y-0.5 active:translate-y-0"
                >
                  Baskıya Başla
                </Link>
              </div>

              {/* Micro stats */}
              <div className="flex gap-6 sm:gap-10 pt-4 border-t border-border">
                {[
                  { num: "50.000+", label: "Mutlu Müşteri" },
                  { num: "2–5 gün", label: "Teslimat" },
                  { num: "4.9 ★", label: "Ortalama Puan" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="font-serif text-xl text-text font-semibold">{s.num}</p>
                    <p className="text-xs text-text-light mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — floating polaroids */}
            <div className="relative h-[480px] hidden lg:block">
              {/* Back */}
              <div className="pol-2 absolute bg-white rounded-sm shadow-xl p-3 pb-10 w-52"
                style={{ rotate: "9deg", top: "4%", left: "52%" }}>
                <div className="w-full h-36 bg-amber-100 rounded-sm flex items-center justify-center">
                  <span className="text-5xl">🌊</span>
                </div>
                <p className="text-center text-[11px] text-text-light mt-3 font-sans">yaz tatili 2024</p>
              </div>

              {/* Middle */}
              <div className="pol-3 absolute bg-white rounded-sm shadow-2xl p-3 pb-10 w-60"
                style={{ rotate: "-1deg", top: "18%", left: "20%" }}>
                <div className="w-full h-44 bg-rose-100 rounded-sm flex items-center justify-center">
                  <span className="text-6xl">🌸</span>
                </div>
                <p className="text-center text-[11px] text-text-light mt-3 font-sans">ilkbahar 🌸</p>
              </div>

              {/* Front */}
              <div className="pol-1 absolute bg-white rounded-sm shadow-xl p-3 pb-10 w-52"
                style={{ rotate: "-5deg", top: "50%", left: "44%" }}>
                <div className="w-full h-36 bg-violet-100 rounded-sm flex items-center justify-center">
                  <span className="text-5xl">👨‍👩‍👧</span>
                </div>
                <p className="text-center text-[11px] text-text-light mt-3 font-sans">aile günü 💕</p>
              </div>

              {/* Decorative pin on middle polaroid */}
              <div className="absolute w-3.5 h-3.5 rounded-full bg-primary shadow z-10"
                style={{ top: "17%", left: "calc(20% + 6.5rem)" }} />
            </div>
          </div>
        </section>

        {/* ── Nasıl Çalışır ─────────────────────────────── */}
        <section className="py-28 px-8 bg-white border-y border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20">
              <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-4">Süreç</p>
              <h2 className="font-serif text-3xl md:text-5xl text-text">Üç adımda tamamdır</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
              {/* Dashed connector */}
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

        {/* ── Kategoriler — Asimetrik grid ─────────────── */}
        <section className="py-28 px-8 bg-bg">
          <div className="max-w-6xl mx-auto">
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
              {/* Featured — large */}
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

              {/* Small cards */}
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

        <FeaturedStrip products={featured} />

        {/* ── Güven Şeridi — Terracotta ─────────────────── */}
        <section className="py-12 px-8 bg-primary">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
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

        {/* ── Premium Kalite ────────────────────────────── */}
        <section className="py-28 px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-4">Neden AnıBaskı?</p>
              <h2 className="font-serif text-3xl md:text-5xl text-text">Farkımız kalitemizden gelir</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: "✨", title: "Premium Kalite", desc: "Solmayan, canlı renkler veren Fujifilm fotoğraf kağıtlarına basıyoruz.", bg: "bg-accent/20", border: "border-accent/30" },
                { icon: "📱", title: "Kolay Tasarım", desc: "Telefonunuzdan veya bilgisayarınızdan saniyeler içinde fotoğraf yükleyin.", bg: "bg-primary/8", border: "border-primary/20" },
                { icon: "🎁", title: "Özenli Paketleme", desc: "Hediyeye hazır, şık ve zarar görmeyecek özel kutularda gönderilir.", bg: "bg-rose-50", border: "border-rose-100" },
              ].map((f) => (
                <div key={f.title} className={`p-8 rounded-3xl border ${f.bg} ${f.border} flex flex-col gap-4 hover:shadow-soft transition-shadow`}>
                  <span className="text-3xl">{f.icon}</span>
                  <h3 className="font-serif text-xl text-text">{f.title}</h3>
                  <p className="text-sm text-text-light leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Son CTA — Koyu bölüm ──────────────────────── */}
        <section className="relative py-36 px-8 bg-text overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-[350px] h-[350px] rounded-full bg-accent/15 blur-3xl" />
          </div>
          <div className="relative max-w-2xl mx-auto text-center flex flex-col items-center gap-8">
            <h2 className="font-serif text-4xl md:text-6xl text-white leading-tight">
              Bir anınızı{" "}
              <em className="not-italic text-primary">hayata</em>{" "}
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

      </main>
      <Footer />
    </>
  );
}
