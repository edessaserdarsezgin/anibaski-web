import { notFound, permanentRedirect } from "next/navigation";
import { resolveSlugRedirect } from "@/lib/slugHistory";
import ProductCard from "@/components/product/ProductCard";
import CategoryHero from "@/components/category/CategoryHero";
import { getCollectionBySlug, getCollectionProducts } from "@/lib/collections";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};
  const title = String(collection.metaTitle ?? "").trim() || collection.name;
  const description = String(collection.metaDescription ?? "").trim()
    || (collection.description
      ? String(collection.description).slice(0, 155)
      : `${collection.name} koleksiyonunu keşfedin. AnıBaskı ile anılarınızı kalıcı hediyelere dönüştürün.`);
  return {
    title,
    description,
    alternates: { canonical: `/koleksiyonlar/${slug}` },
    openGraph: {
      title,
      description,
      ...(collection.hero_image ? { images: [{ url: collection.hero_image }] } : {}),
    },
  };
}

export default async function KoleksiyonPage({ params }: Props) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) {
    const dest = await resolveSlugRedirect("collection", slug);
    if (dest) permanentRedirect(`/koleksiyonlar/${dest}`);
    notFound();
  }

  const products = await getCollectionProducts(collection.id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  type CardProduct = { id: string; name: string; slug: string; basePrice: number; images: string[] | null; discount_percent: number | null; discount_starts_at: string | null; discount_ends_at: string | null; productTags?: unknown };
  const list = products as unknown as CardProduct[];

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name,
    ...(collection.description ? { description: collection.description } : {}),
    url: `${siteUrl}/koleksiyonlar/${slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: list.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
        url: `${siteUrl}/urunler/${p.slug}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <CategoryHero
        category={{
          name: collection.name,
          slug: collection.slug,
          description: collection.description,
          hero_image: collection.hero_image,
          theme_color: collection.theme_color,
          cta_label: collection.cta_label,
          cta_href: collection.cta_href,
        }}
        parentCategory={null}
        productCount={list.length}
        crumbs={[{ name: "Koleksiyonlar", href: "/koleksiyonlar" }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {!list.length ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <p className="font-serif text-2xl text-text">Bu koleksiyonda henüz ürün bulunmuyor</p>
            <p className="text-text-light text-sm">Yakında yeni ürünler eklenecek.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {list.map((product) => {
              const productTags = product.productTags as { tagId: string; position: string; tag: { name: string; color: string } }[] | null;
              return (
                <ProductCard
                  key={product.id}
                  product={{ ...product, basePrice: Number(product.basePrice), productTags }}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
