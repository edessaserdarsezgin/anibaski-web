import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product/ProductCard";

export const metadata = {
  title: "Tüm Ürünler | AnıBaskı",
  description: "Fotoğraf baskısı, fotokitap, tablo, polaroid ve daha fazlası. Tüm ürünleri keşfedin, anılarınızı kalıcı hediyelere dönüştürün.",
};

export default async function UrunlerPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const adminDb = createAdminClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    adminDb.from("products").select("id, name, slug, description, basePrice, images, category:categories(name, slug)").order("createdAt", { ascending: false }),
    adminDb.from("categories").select("id, name, slug").order("name"),
  ]);

  const { data: favoritesData } = user
    ? await adminDb.from("favorites").select("productId").eq("userId", user.id)
    : { data: [] };
  const favoriteIds = new Set((favoritesData ?? []).map((f: { productId: string }) => f.productId));

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
                <ProductCard
                  key={product.id}
                  product={{ ...product, basePrice: Number(product.basePrice), category }}
                  initialFavorited={favoriteIds.has(product.id)}
                />
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
