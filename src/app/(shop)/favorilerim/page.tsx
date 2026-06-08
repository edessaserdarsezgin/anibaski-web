import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product/ProductCard";
import BackButton from "@/components/ui/BackButton";

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
        <div className="flex flex-col items-center justify-center py-32 gap-5">
          <div className="w-20 h-20 rounded-3xl bg-bg border border-border flex items-center justify-center text-4xl">♡</div>
          <div className="text-center">
            <p className="font-serif text-2xl text-text mb-2">Henüz favori ürün yok</p>
            <p className="text-text-light text-sm">Ürünlerdeki ♡ butonuna tıklayarak burada saklayabilirsiniz.</p>
          </div>
          <Link href="/urunler" className="px-6 py-2.5 border border-border rounded-full text-sm font-semibold text-text-light hover:border-primary hover:text-primary transition-colors">
            Ürünlere Göz At
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              initialFavorited={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
