import { notFound } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import ProductFilterBar from "@/components/product/ProductFilterBar";
import {
  getCategoryBySlug,
  getSubCategories,
  getCategoryById,
  getTags,
  getProductIdsByTag,
  getProductCategoriesJoin,
  getProductsInCategory
} from "@/lib/catalog";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; tag?: string }>;
};

function getSortOrder(sort: string): { column: string; ascending: boolean } {
  switch (sort) {
    case "price_asc":  return { column: "basePrice", ascending: true };
    case "price_desc": return { column: "basePrice", ascending: false };
    case "name_asc":   return { column: "name",      ascending: true };
    case "popular":    return { column: "orderCount", ascending: false };
    default:           return { column: "createdAt", ascending: false };
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  const description = category.description
    ? String(category.description).slice(0, 155)
    : `${category.name} ürünlerini keşfedin. AnıBaskı ile anılarınızı kalıcı hediyelere dönüştürün.`;
  return {
    title: `${category.name} | AnıBaskı`,
    description,
    alternates: { canonical: `/kategoriler/${slug}` },
    openGraph: { title: category.name, description },
  };
}

export default async function KategoriPage({ params, searchParams }: Props) {
  const [{ slug }, { sort = "newest", tag }] = await Promise.all([params, searchParams]);
  const { column, ascending } = getSortOrder(sort);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  // Alt kategoriler, parent kategori, etiketler ve filtre eşleşmeleri paralel
  const [subCategories, parentCategory, allTags, tagProductIds] = await Promise.all([
    getSubCategories(category.id),
    category.parentId ? getCategoryById(category.parentId) : Promise.resolve(null),
    getTags(),
    tag ? getProductIdsByTag(tag) : Promise.resolve(null),
  ]);

  // Ürünler: bu kategorinin ürünleri + alt kategorilerinin ürünleri
  const subCategoryIds = (subCategories ?? []).map(s => s.id);
  const allCategoryIds = [category.id, ...subCategoryIds];

  const joinProductIds = await getProductCategoriesJoin(allCategoryIds);

  const products = await getProductsInCategory(
    allCategoryIds,
    joinProductIds,
    column,
    ascending,
    tagProductIds
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: siteUrl },
    ...(parentCategory ? [{ "@type": "ListItem", position: 2, name: parentCategory.name, item: `${siteUrl}/kategoriler/${parentCategory.slug}` }] : []),
    { "@type": "ListItem", position: parentCategory ? 3 : 2, name: category.name, item: `${siteUrl}/kategoriler/${slug}` },
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* ── Hero ────────────────────────────────────── */}
      <section className="relative bg-bg border-b border-border overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-accent/15 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-8 py-14">
          <p className="text-sm text-text-light flex items-center gap-1.5 mb-6 flex-wrap">
            <Link href="/" className="hover:text-primary transition-colors">Ana Sayfa</Link>
            <span className="text-border">/</span>
            <Link href="/urunler" className="hover:text-primary transition-colors">Ürünler</Link>
            {parentCategory && (
              <>
                <span className="text-border">/</span>
                <Link href={`/kategoriler/${parentCategory.slug}`} className="hover:text-primary transition-colors">
                  {parentCategory.name}
                </Link>
              </>
            )}
            <span className="text-border">/</span>
            <span className="text-text">{category.name}</span>
          </p>
          <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-3">Koleksiyon</p>
          <h1 className="font-serif text-5xl md:text-6xl text-text leading-tight">{category.name}</h1>
          {category.description && (
            <p className="mt-3 text-text-light text-lg max-w-xl">{category.description}</p>
          )}
          <p className="mt-3 text-text-light text-sm">{products?.length ?? 0} ürün · Türkiye geneli kargo</p>
        </div>
      </section>

      {(products?.length ?? 0) > 0 && (
        <ProductFilterBar tags={allTags ?? []} currentTag={tag} currentSort={sort} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">

        {/* ── Alt Kategori Filtreleri (sadece ana kategoride göster) ── */}
        {(subCategories?.length ?? 0) > 0 && (
          <div className="flex gap-2 flex-wrap mb-10">
            {(() => {
              const queryParts = [
                sort !== "newest" ? `sort=${sort}` : "",
                tag ? `tag=${tag}` : "",
              ].filter(Boolean);
              const queryString = queryParts.length ? `?${queryParts.join("&")}` : "";
              return (
                <>
                  <Link
                    href={`/kategoriler/${category.slug}${queryString}`}
                    className="px-5 py-2 rounded-full text-sm font-semibold border bg-text text-white border-text transition-all"
                  >
                    Tümü
                  </Link>
                  {subCategories!.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/kategoriler/${sub.slug}${queryString}`}
                      className="px-5 py-2 rounded-full text-sm font-semibold border border-border text-text-light hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </>
              );
            })()}
          </div>
        )}

        {!products?.length ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5">
            <div className="w-20 h-20 rounded-3xl bg-bg border border-border flex items-center justify-center">
              <svg className="w-8 h-8 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm4.5-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-serif text-2xl text-text mb-2">Bu kategoride henüz ürün bulunmuyor</p>
              <p className="text-text-light text-sm">Yakında yeni ürünler eklenecek.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/urunler" className="px-6 py-2.5 border border-border rounded-full text-sm font-semibold text-text-light hover:border-primary hover:text-primary transition-colors">
                Tüm Ürünler
              </Link>
              <Link href="/" className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-full text-sm font-semibold transition-colors">
                Ana Sayfaya Dön
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {products.map((product) => {
                const productTags = product.productTags as unknown as { tagId: string; position: string; tag: { name: string; color: string } }[] | null;
                return (
                  <ProductCard
                    key={product.id}
                    product={{ ...product, basePrice: Number(product.basePrice), productTags }}
                  />
                );
              })}
            </div>

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
          </>
        )}
      </div>
    </>
  );
}
