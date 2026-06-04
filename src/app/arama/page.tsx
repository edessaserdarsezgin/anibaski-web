import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/server";
import PriceTag from "@/components/product/PriceTag";

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

  let products: Product[] = [];
  if (query.length >= 2) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, basePrice, images, description, discount_percent, discount_starts_at, discount_ends_at, category:categories(name, slug)")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq("isActive", true)
      .order("name", { ascending: true });
    products = (data ?? []) as Product[];
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const cat = Array.isArray(p.category) ? p.category[0] : p.category;
            return (
              <Link
                key={p.id}
                href={`/urunler/${p.slug}`}
                className="group bg-white rounded-2xl border border-border overflow-hidden hover:border-primary hover:shadow-hover transition-all"
              >
                <div className="relative aspect-square bg-bg">
                  {p.images?.[0] ? (
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-light text-sm">Görsel yok</div>
                  )}
                </div>
                <div className="p-5">
                  {cat && <p className="text-xs text-text-light mb-1">{cat.name}</p>}
                  <h2 className="font-serif text-lg text-text mb-2">{p.name}</h2>
                  <PriceTag basePrice={Number(p.basePrice)} discount={{ discount_percent: p.discount_percent ?? null, discount_starts_at: p.discount_starts_at ?? null, discount_ends_at: p.discount_ends_at ?? null }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
