import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import SortSelect from "@/components/product/SortSelect";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
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
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name, description")
    .eq("slug", slug)
    .single();
  if (!category) return {};
  const description = category.description
    ? String(category.description).slice(0, 155)
    : `${category.name} ürünlerini keşfedin. AnıBaskı ile anılarınızı kalıcı hediyelere dönüştürün.`;
  return {
    title: `${category.name} | AnıBaskı`,
    description,
    openGraph: { title: category.name, description },
  };
}

export default async function KategoriPage({ params, searchParams }: Props) {
  const [{ slug }, { sort = "newest" }] = await Promise.all([params, searchParams]);
  const { column, ascending } = getSortOrder(sort);
  const adminDb = createAdminClient();

  const { data: category } = await adminDb
    .from("categories")
    .select("id, name, slug, description, parentId")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  // Alt kategoriler (bu bir ana kategori ise)
  const { data: subCategories } = await adminDb
    .from("categories")
    .select("id, name, slug")
    .eq("parentId", category.id)
    .order("name");

  // Ana kategori (bu bir alt kategori ise)
  const { data: parentCategory } = category.parentId
    ? await adminDb.from("categories").select("id, name, slug").eq("id", category.parentId).single()
    : { data: null };

  // Ürünler: bu kategorinin ürünleri + alt kategorilerinin ürünleri
  const subCategoryIds = (subCategories ?? []).map(s => s.id);
  const allCategoryIds = [category.id, ...subCategoryIds];

  const { data: products } = await adminDb
    .from("products_with_order_count")
    .select("id, name, slug, description, basePrice, images, categoryId, productTags:product_tags(tagId, position, tag:tags(name, color))")
    .in("categoryId", allCategoryIds)
    .eq("isActive", true)
    .order(column, { ascending });

  return (
    <>
      {/* ── Hero ────────────────────────────────────── */}
      <section className="relative bg-bg border-b border-border overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-accent/15 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-8 py-14">
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

      <div className="max-w-6xl mx-auto px-8 py-12">

        {/* ── Alt Kategori Filtreleri (sadece ana kategoride göster) ── */}
        {(subCategories?.length ?? 0) > 0 && (
          <div className="flex gap-2 flex-wrap mb-10">
            <Link
              href={`/kategoriler/${category.slug}`}
              className="px-5 py-2 rounded-full text-sm font-semibold border bg-text text-white border-text transition-all"
            >
              Tümü
            </Link>
            {subCategories!.map((sub) => (
              <Link
                key={sub.id}
                href={`/kategoriler/${sub.slug}`}
                className="px-5 py-2 rounded-full text-sm font-semibold border border-border text-text-light hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
              >
                {sub.name}
              </Link>
            ))}
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
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-text-light">{products?.length ?? 0} ürün</p>
              <Suspense fallback={<div className="w-40 h-9 rounded-lg border border-border bg-bg" />}>
                <SortSelect current={sort} />
              </Suspense>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/urunler/${product.slug}`}
                  className="group bg-white rounded-3xl border border-border overflow-hidden hover:shadow-hover hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
                >
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm4.5-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs">Görsel yok</span>
                      </div>
                    )}
                    {(["top-left","bottom-left","bottom-right"] as const).map((pos) => {
                      const tags = (product.productTags as unknown as { tagId: string; position: string; tag: { name: string; color: string } }[] | null)?.filter(pt => pt.position === pos) ?? [];
                      if (!tags.length) return null;
                      const cls: Record<string, string> = {
                        "top-left":    "absolute top-3 left-3 z-10 flex flex-col gap-1.5",
                        "bottom-left": "absolute bottom-3 left-3 z-10 flex flex-col gap-1.5",
                        "bottom-right":"absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1.5",
                      };
                      return (
                        <div key={pos} className={cls[pos]}>
                          {tags.map(pt => (
                            <span key={pt.tagId} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-md" style={{ backgroundColor: pt.tag.color }}>
                              {pt.tag.name}
                            </span>
                          ))}
                        </div>
                      );
                    })}
                  </div>
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
              ))}
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
