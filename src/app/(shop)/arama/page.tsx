import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product/ProductCard";

export const metadata = {
  title: "Arama Sonuçları",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ q?: string }> };

type Product = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  images: string[] | null;
  description: string | null;
  category: { name: string; slug: string } | { name: string; slug: string }[] | null;
  discount_percent?: number | null;
  discount_starts_at?: string | null;
  discount_ends_at?: string | null;
};

export default async function AramaPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  // PostgREST .or() filter injection'a karşı temizlik (display için query, filtre için safeQuery)
  const safeQuery = query.replace(/[,()%:*\\]/g, " ").trim();

  let products: Product[] = [];
  if (safeQuery.length >= 2) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, basePrice, images, description, discount_percent, discount_starts_at, discount_ends_at, category:categories!products_categoryId_fkey(name, slug)")
      .or(`name.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`)
      .eq("isActive", true)
      .order("name", { ascending: true });
    products = (data ?? []) as Product[];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <h1 className="font-serif text-3xl text-text mb-2">Arama Sonuçları</h1>
      <p className="text-sm text-text-light mb-8">
        {query
          ? <>&quot;<span className="text-text font-semibold">{query}</span>&quot; için {products.length} ürün bulundu</>
          : "Arama yapmak için yukarıdaki çubuğu kullanın."}
      </p>

      {query.length >= 2 && products.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <h2 className="font-serif text-xl text-text mb-2">Sonuç bulunamadı</h2>
          <p className="text-text-light mb-6">Farklı bir kelime ile aramayı deneyebilirsiniz.</p>
          <Link
            href="/urunler"
            className="inline-block px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors"
          >
            Tüm Ürünlere Göz At
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {products.map((p) => {
            const category = Array.isArray(p.category) ? p.category[0] : p.category;
            return (
              <ProductCard
                key={p.id}
                product={{ ...p, basePrice: Number(p.basePrice), category }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
