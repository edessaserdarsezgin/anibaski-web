import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import ProductFilterBar from "@/components/product/ProductFilterBar";
import { getReadyMadeCategoryIds } from "@/lib/readyMade";
import {
  getTags,
  getProductIdsByTag,
  getProductsForCatalog
} from "@/lib/catalog";

type Props = { searchParams: Promise<{ sort?: string; tag?: string }> };

function getSortOrder(sort: string): { column: string; ascending: boolean } {
  switch (sort) {
    case "price_asc":  return { column: "basePrice", ascending: true };
    case "price_desc": return { column: "basePrice", ascending: false };
    case "name_asc":   return { column: "name",      ascending: true };
    case "popular":    return { column: "orderCount", ascending: false };
    default:           return { column: "createdAt", ascending: false };
  }
}

export const metadata = {
  title: "Tüm Ürünler | AnıBaskı",
  description: "Fotoğraf baskısı, fotokitap, tablo, polaroid ve daha fazlası. Tüm ürünleri keşfedin, anılarınızı kalıcı hediyelere dönüştürün.",
};

export default async function UrunlerPage({ searchParams }: Props) {
  const { sort = "newest", tag } = await searchParams;
  const { column, ascending } = getSortOrder(sort);

  const [allTags, tagProductIds, readyMadeIds] = await Promise.all([
    getTags(),
    tag ? getProductIdsByTag(tag) : Promise.resolve(null),
    getReadyMadeCategoryIds(),
  ]);

  const products = await getProductsForCatalog(column, ascending, tagProductIds, readyMadeIds);

  return (
    <>
      {/* ── Sayfa Başlığı ───────────────────────────── */}
      <section className="relative bg-bg border-b border-border overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-accent/15 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-8 py-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-3">Koleksiyonlar</p>
            <h1 className="font-serif text-5xl md:text-6xl text-text leading-tight">
              Tüm Ürünler
            </h1>
            <p className="mt-3 text-text-light text-lg">
              {products?.length ?? 0} ürün · Türkiye geneli kargo
            </p>
          </div>
        </div>
      </section>

      {(products?.length ?? 0) > 0 && (
        <ProductFilterBar tags={allTags ?? []} currentTag={tag} currentSort={sort} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">

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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map((product, idx) => {
              const category = product.category as unknown as { name: string; slug: string } | null;
              const productTags = product.productTags as unknown as { tagId: string; position: string; tag: { name: string; color: string } }[] | null;
              return (
                <ProductCard
                  key={product.id}
                  product={{ ...product, basePrice: Number(product.basePrice), category, productTags }}
                  priority={idx < 3}
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
              <p className="text-white/50 text-sm">Size en uygun ürünü bulmak için yardım edelim.</p>
            </div>
            <Link
              href="/urun-rehberi"
              className="relative shrink-0 px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-all hover:-translate-y-0.5 whitespace-nowrap"
            >
              Ürün Rehberi
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
