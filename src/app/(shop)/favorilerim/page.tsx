import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product/ProductCard";
import BackButton from "@/components/ui/BackButton";
import EmptyState from "@/components/ui/EmptyState";

export const metadata = { title: "Favorilerim | AnıBaskı", robots: { index: false, follow: false } };

export default async function FavorilerimPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/favorilerim");

  const adminDb = createAdminClient();
  const { data: favorites } = await adminDb
    .from("favorites")
    .select("productId, product:products(id, name, slug, description, basePrice, images, discount_percent, discount_starts_at, discount_ends_at, category:categories!products_categoryId_fkey(name, slug), productTags:product_tags(tagId, position, tag:tags(name, color)))")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false });

  const products = (favorites ?? [])
    .map((f) => f.product as unknown as {
      id: string; name: string; slug: string; description?: string | null;
      basePrice: number; images?: string[] | null;
      category?: { name: string; slug: string } | null;
      productTags?: { tagId: string; position: string; tag: { name: string; color: string } }[] | null;
      discount_percent?: number | null; discount_starts_at?: string | null; discount_ends_at?: string | null;
    })
    .filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
      <BackButton className="mb-6" />
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-text">Favorilerim</h1>
        <p className="text-text-light mt-2">{products.length} ürün kaydedildi</p>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          }
          title="Favorilerin şimdilik boş 🤍"
          subtitle="Beğendiğin ürünleri kalp ikonuyla buraya ekle, sonra kolayca geri dön."
          ctaHref="/urunler"
          ctaLabel="Alışverişe Başla"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </div>
  );
}
