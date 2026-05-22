import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Tüm Ürünler | AnıBaskı",
  description: "Fotoğraf baskısı, fotokitap, tablo, polaroid ve daha fazlası. Tüm ürünleri keşfedin, anılarınızı kalıcı hediyelere dönüştürün.",
};

export default async function UrunlerPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("id, name, slug, description, basePrice, images, category:categories(name, slug)").order("createdAt", { ascending: false }),
    supabase.from("categories").select("id, name, slug").order("name"),
  ]);

  return (
    <>
      {/* ── Sayfa Başlığı ───────────────────────────── */}
      <section className="relative bg-bg border-b border-border overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-accent/15 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-8 py-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-3">Koleksiyonlar</p>
            <h1 className="font-serif text-5xl md:text-6xl text-text leading-tight">
              Tüm Ürünler
            </h1>
            <p className="mt-3 text-text-light text-lg">
              {products?.length ?? 0} ürün · Türkiye geneli kargo
            </p>
          </div>
          <Link
            href="/fotograf-yukle"
            className="self-start md:self-auto px-7 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-all shadow-soft hover:shadow-hover hover:-translate-y-0.5 shrink-0"
          >
            Fotoğraf Yükle
          </Link>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-8 py-12">

        {/* ── Kategori Filtreleri ──────────────────────── */}
        <div className="flex gap-2 flex-wrap mb-12">
          <Link
            href="/urunler"
            className="px-5 py-2 rounded-full text-sm font-semibold border bg-text text-white border-text transition-all"
          >
            Tümü
          </Link>
          {categories?.map((cat) => (
            <Link
              key={cat.id}
              href={`/kategoriler/${cat.slug}`}
              className="px-5 py-2 rounded-full text-sm font-semibold border border-border text-text-light hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* ── Ürün Grid ───────────────────────────────── */}
        {!products?.length ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5">
            <div className="w-20 h-20 rounded-3xl bg-bg border border-border flex items-center justify-center text-4xl">
              🖼️
            </div>
            <div className="text-center">
              <p className="font-serif text-2xl text-text mb-2">Henüz ürün bulunmuyor</p>
              <p className="text-text-light text-sm">Yakında yeni ürünler eklenecek.</p>
            </div>
            <Link href="/" className="px-6 py-2.5 border border-border rounded-full text-sm font-semibold text-text-light hover:border-primary hover:text-primary transition-colors">
              Ana Sayfaya Dön
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product) => {
              const category = product.category as unknown as { name: string; slug: string } | null;
              return (
                <Link
                  key={product.id}
                  href={`/urunler/${product.slug}`}
                  className="group bg-white rounded-3xl border border-border overflow-hidden hover:shadow-hover hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Görsel */}
                  <div className="relative aspect-[4/3] bg-bg overflow-hidden">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-border">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm0 0h.008v.008H13.5V12zm4.5-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs">Görsel yok</span>
                      </div>
                    )}
                    {/* Kategori etiketi — görsel üzerinde */}
                    {category && (
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-text-light border border-white/50">
                        {category.name}
                      </span>
                    )}
                  </div>

                  {/* Bilgi */}
                  <div className="p-5">
                    <h2 className="font-serif text-base text-text group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-3">
                      {product.name}
                    </h2>
                    {product.description && (
                      <p className="text-xs text-text-light line-clamp-2 leading-relaxed mb-4">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="font-serif text-lg font-semibold text-primary">
                        {Number(product.basePrice).toLocaleString("tr-TR")} ₺
                        <span className="text-xs font-sans font-normal text-text-light ml-1">den itibaren</span>
                      </p>
                      <span className="w-8 h-8 rounded-full border border-border group-hover:border-primary group-hover:bg-primary flex items-center justify-center text-text-light group-hover:text-white transition-all text-sm">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Alt CTA ─────────────────────────────────── */}
        {(products?.length ?? 0) > 0 && (
          <div className="mt-20 py-14 px-10 rounded-3xl bg-text flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
            </div>
            <div className="relative">
              <h3 className="font-serif text-3xl text-white mb-1">Hangi anıyı yaşatmak istersiniz?</h3>
              <p className="text-white/50 text-sm">Fotoğrafınızı yükleyin, gerisini biz halledelim.</p>
            </div>
            <Link
              href="/fotograf-yukle"
              className="relative shrink-0 px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-all hover:-translate-y-0.5 whitespace-nowrap"
            >
              Hemen Başla
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
