import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { GUIDE_NEEDS, GUIDE_GIFTS, type GuideRef } from "@/lib/guide";
import GuideProductCard, { type ResolvedGuideProduct } from "@/components/product/GuideProductCard";
import BeforeAfterSlider from "@/components/studio/BeforeAfterSlider";

export const dynamic = "force-dynamic";
export const metadata = { title: "Baskı Rehberi | AnıBaskı", alternates: { canonical: "/urun-rehberi" } };

const NAV = [
  { href: "#urun", label: "Ürün Rehberi" },
  { href: "#cozunurluk", label: "Çözünürlük" },
  { href: "#ipuclari", label: "Çekim İpuçları" },
  { href: "#ai-studyo", label: "AI Stüdyo" },
  { href: "#hediye", label: "Hediye" },
];

const AI_EXAMPLES = [
  { label: "Anime Efekti", before: "/IMG-20240703-WA0002a.jpg", after: "/anibaski-studyoa.png" },
  { label: "Pixel Art", before: "/deniz-once.jpeg", after: "/deniz-pixelart.png" },
];

const RES_TABLE: { size: string; res: string }[] = [
  { size: "10×15 cm", res: "~2 MP (1200×1800 px)" },
  { size: "13×18 cm", res: "~3 MP" },
  { size: "15×21 cm", res: "~4 MP" },
  { size: "18×24 cm", res: "~6 MP" },
  { size: "20×30 cm", res: "~7 MP (2362×3543 px)" },
  { size: "30×40 cm / Kanvas", res: "~9 MP (kanvas mesafeden bakıldığı için toleranslı)" },
];

const TIPS: { icon: string; title: string; text: string }[] = [
  { icon: "☀️", title: "Gün ışığında çek", text: "Doğal ışık en doğru renkleri verir; mümkünse gündüz, pencere önünde çek." },
  { icon: "🤳", title: "Telefonu sabit tut", text: "Net bir kare için elini sabitle veya bir yüzeye yasla; titreme bulanıklık yapar." },
  { icon: "🔍", title: "Dijital zoom yapma", text: "Zoom çözünürlüğü düşürür; yaklaşman gerekiyorsa fiziksel olarak yaklaş." },
  { icon: "📐", title: "Ürün oranına göre kadrajla", text: "Kanvas/çerçeve için dikey, panorama için yatay; kenarlardan biraz boşluk bırak." },
  { icon: "🎚️", title: "En yüksek çözünürlükte çek", text: "Telefon kamera ayarından en yüksek çözünürlüğü seç; büyük baskılarda fark eder." },
  { icon: "📤", title: "Orijinali gönder", text: "WhatsApp ve bazı uygulamalar fotoğrafı sıkıştırır; bize orijinal/yüksek çözünürlüklü dosyayı yükle." },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-2">{children}</p>;
}

export default async function BaskiRehberiPage() {
  const db = createAdminClient();
  const slugs = Array.from(new Set([...GUIDE_NEEDS, ...GUIDE_GIFTS].map((r) => r.slug)));

  const { data } = await db
    .from("products")
    .select("slug, name, basePrice, images, discount_percent, discount_starts_at, discount_ends_at")
    .in("slug", slugs)
    .eq("isActive", true);

  const map = new Map<string, ResolvedGuideProduct>();
  for (const p of (data ?? []) as Array<{
    slug: string;
    name: string;
    basePrice: string | number;
    images: string[] | null;
    discount_percent: number | null;
    discount_starts_at: string | null;
    discount_ends_at: string | null;
  }>) {
    map.set(p.slug, {
      name: p.name,
      slug: p.slug,
      basePrice: Number(p.basePrice),
      image: p.images?.[0] ?? null,
      discount: {
        discount_percent: p.discount_percent ?? null,
        discount_starts_at: p.discount_starts_at ?? null,
        discount_ends_at: p.discount_ends_at ?? null,
      },
    });
  }

  const resolve = (r: GuideRef): ResolvedGuideProduct | null => map.get(r.slug) ?? null;

  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      {/* Hero */}
      <div className="mb-8">
        <Eyebrow>Baskı Rehberi</Eyebrow>
        <h1 className="font-serif text-4xl md:text-5xl text-text mb-3">Fotoğrafların için doğru ürünü seç</h1>
        <p className="text-text-light max-w-2xl">
          Hangi ürün sana uygun, kaliteli baskı için neye dikkat etmeli, nasıl daha iyi fotoğraf çekersin — hepsi
          burada. Kartlardaki ürünler güncel fiyatlarıyla doğrudan mağazamızdan gelir.
        </p>
      </div>

      {/* Sticky bölüm menüsü */}
      <nav className="sticky top-0 z-10 -mx-8 px-8 py-3 bg-bg/90 backdrop-blur border-b border-border mb-10 flex flex-wrap gap-2">
        {NAV.map((n) => (
          <a
            key={n.href}
            href={n.href}
            className="px-4 py-1.5 rounded-full text-sm bg-white border border-border text-text hover:border-primary hover:text-primary transition-colors"
          >
            {n.label}
          </a>
        ))}
      </nav>

      {/* 1 — Hangi ürün sana uygun? */}
      <section id="urun" className="scroll-mt-20 mb-14">
        <Eyebrow>Ürün Rehberi</Eyebrow>
        <h2 className="font-serif text-3xl text-text mb-6">Hangi ürün sana uygun?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GUIDE_NEEDS.map((r) => (
            <GuideProductCard
              key={r.scenario}
              icon={r.icon}
              scenario={r.scenario}
              blurb={r.blurb}
              product={resolve(r)}
              categorySlug={r.categorySlug}
            />
          ))}
        </div>
      </section>

      {/* 2 — Çözünürlük */}
      <section id="cozunurluk" className="scroll-mt-20 mb-14">
        <Eyebrow>Kalite</Eyebrow>
        <h2 className="font-serif text-3xl text-text mb-6">Kaliteli baskı için çözünürlük</h2>
        <div className="bg-white rounded-2xl border border-border overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg text-text-light text-left">
                <th className="px-5 py-3 font-semibold">Baskı boyutu</th>
                <th className="px-5 py-3 font-semibold">Önerilen min. çözünürlük</th>
              </tr>
            </thead>
            <tbody>
              {RES_TABLE.map((row) => (
                <tr key={row.size} className="border-t border-border">
                  <td className="px-5 py-3 font-semibold text-text">{row.size}</td>
                  <td className="px-5 py-3 text-text-light">{row.res}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-text-light leading-relaxed">
          Düşük çözünürlüklü fotoğraflar büyük baskıda bulanık veya pikselli çıkabilir. WhatsApp ve bazı uygulamalar
          fotoğrafı sıkıştırır — en iyi sonuç için bize{" "}
          <strong className="text-text">orijinal, yüksek çözünürlüklü</strong> dosyayı yükle.
        </p>
      </section>

      {/* 3 — Çekim ipuçları */}
      <section id="ipuclari" className="scroll-mt-20 mb-14">
        <Eyebrow>İpuçları</Eyebrow>
        <h2 className="font-serif text-3xl text-text mb-6">Daha iyi fotoğraf için ipuçları</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TIPS.map((t) => (
            <div key={t.title} className="bg-white rounded-2xl border border-border p-5">
              <span className="text-2xl">{t.icon}</span>
              <p className="font-semibold text-text mt-3 mb-1">{t.title}</p>
              <p className="text-sm text-text-light leading-relaxed">{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4 — AI Stüdyo */}
      <section id="ai-studyo" className="scroll-mt-20 mb-14">
        <Eyebrow>AI Stüdyo</Eyebrow>
        <h2 className="font-serif text-3xl text-text mb-3">Fotoğrafın baskıya hazır değil mi?</h2>
        <p className="text-text-light text-sm leading-relaxed mb-6 max-w-2xl">
          Eski, bulanık veya küçük çözünürlüklü fotoğraflar büyük baskılarda sorun çıkarabilir.
          AI Stüdyo ile fotoğrafını kalitesini yükseltebilir, sanatsal efektler uygulayabilir —
          sonucu beğenince tek tıkla baskıya gönderebilirsin.
        </p>

        <div className="grid sm:grid-cols-2 gap-5 mb-6 max-w-2xl">
          {AI_EXAMPLES.map((ex) => (
            <div key={ex.label} className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-secondary uppercase tracking-wide">{ex.label}</p>
              <BeforeAfterSlider before={ex.before} after={ex.after} aspectRatio={4 / 3} />
            </div>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-2xl">
          <div className="flex-1">
            <p className="font-semibold text-text mb-1">AI Stüdyo — ücretsiz dene</p>
            <p className="text-sm text-text-light">Her gün ücretsiz kredi · Baskıdan ekstra kredi kazan</p>
          </div>
          <Link
            href="/studyo"
            className="shrink-0 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-full transition-colors"
          >
            Stüdyo&apos;ya Git ✨
          </Link>
        </div>
      </section>

      {/* 5 — Hediye */}
      <section id="hediye" className="scroll-mt-20 mb-14">
        <Eyebrow>Hediye</Eyebrow>
        <h2 className="font-serif text-3xl text-text mb-6">Hediye önerileri</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {GUIDE_GIFTS.map((r) => (
            <GuideProductCard
              key={r.scenario}
              icon={r.icon}
              scenario={r.scenario}
              blurb={r.blurb}
              product={resolve(r)}
              categorySlug={r.categorySlug}
            />
          ))}
        </div>
      </section>

      {/* Kapanış CTA */}
      <div className="bg-bg border border-border rounded-2xl p-6 text-center">
        <p className="text-text-light mb-3">Aradığını bulamadın mı? Tüm ürünlerimize göz at.</p>
        <Link
          href="/urunler"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-full transition-colors"
        >
          Tüm Ürünler →
        </Link>
      </div>
    </div>
  );
}
