import Link from "next/link";
import { Suspense } from "react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product/ProductCard";
import SortSelect from "@/components/product/SortSelect";
import TagFilter from "@/components/product/TagFilter";
import { getReadyMadeCategoryIds } from "@/lib/readyMade";

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
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const adminDb = createAdminClient();

  const [{ data: categories }, { data: allTags }, tagIdsResult, readyMadeIds] = await Promise.all([
    adminDb.from("categories").select("id, name, slug, parentId").order("name"),
    adminDb.from("tags").select("id, name, color").order("name"),
    tag
      ? adminDb.from("product_tags").select("productId").eq("tagId", tag)
      : Promise.resolve({ data: null }),
    getReadyMadeCategoryIds(),
  ]);

  const tagProductIds = (tagIdsResult.data as { productId: string }[] | null)?.map(r => r.productId) ?? null;
  let baseQuery = adminDb
    .from("products_with_order_count")
    .select("id, name, slug, description, basePrice, images, discount_percent, discount_starts_at, discount_ends_at, category:categories!products_categoryId_fkey(name, slug), productTags:product_tags(tagId, position, tag:tags(name, color))")
    .eq("isActive", true)
    .order(column, { ascending });
  if (readyMadeIds.length > 0) {
    baseQuery = baseQuery.not("categoryId", "in", `(${readyMadeIds.join(",")})`);
  }
  const { data: products } = tag
    ? (tagProductIds && tagProductIds.length > 0
        ? await baseQuery.in("id", tagProductIds)
        : { data: [] })
    : await baseQuery;

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
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-8 py-12">

        {/* ── Kategori Filtreleri ──────────────────────── */}
        <div className="flex gap-2 flex-wrap mb-12">
          {(() => {
            const queryParts = [
              sort !== "newest" ? `sort=${sort}` : "",
              tag ? `tag=${tag}` : "",
            ].filter(Boolean);
            const queryString = queryParts.length ? `?${queryParts.join("&")}` : "";
            return (
              <>
                <Link
                  href={`/urunler${queryString}`}
                  className="px-5 py-2 rounded-full text-sm font-semibold border bg-text text-white border-text transition-all"
                >
                  Tümü
                </Link>
                {categories?.filter(c => !c.parentId && !readyMadeIds.includes(c.id)).map((parent) => {
                  const children = categories.filter(c => c.parentId === parent.id);
                  return (
                    <div key={parent.id} className="flex items-center gap-1 flex-wrap">
                      <Link
                        href={`/kategoriler/${parent.slug}${queryString}`}
                        className="px-5 py-2 rounded-full text-sm font-semibold border border-border text-text-light hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                      >
                        {parent.name}
                      </Link>
                      {children.map(sub => (
                        <Link
                          key={sub.id}
                          href={`/kategoriler/${sub.slug}${queryString}`}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-border/60 text-text-light hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </>
            );
          })()}
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
          <>
          <div className="flex items-center justify-between mb-5">
            <Suspense fallback={<div className="h-9" />}>
              <TagFilter tags={allTags ?? []} current={tag} />
            </Suspense>
            <Suspense fallback={<div className="w-40 h-9 rounded-lg border border-border bg-bg" />}>
              <SortSelect current={sort} />
            </Suspense>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product, idx) => {
              const category = product.category as unknown as { name: string; slug: string } | null;
              const productTags = product.productTags as unknown as { tagId: string; position: string; tag: { name: string; color: string } }[] | null;
              return (
                <ProductCard
                  key={product.id}
                  product={{ ...product, basePrice: Number(product.basePrice), category, productTags }}
                  initialFavorited={favoriteIds.has(product.id)}
                  priority={idx < 3}
                />
              );
            })}
          </div>
          </>
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
