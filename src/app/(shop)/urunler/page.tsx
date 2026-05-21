import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Tüm Ürünler | AnıBaskı" };

export default async function UrunlerPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("id, name, slug, description, basePrice, images, category:categories(name)").order("createdAt", { ascending: false }),
    supabase.from("categories").select("id, name, slug").order("name"),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <div className="mb-10">
        <h1 className="font-serif text-3xl text-text">Tüm Ürünler</h1>
        <p className="mt-2 text-text-light">
          {products?.length ?? 0} ürün listeleniyor
        </p>
      </div>

      <div className="flex gap-2 flex-wrap mb-8">
        <Link href="/urunler" className="px-4 py-1.5 rounded-full text-sm font-semibold border border-primary bg-primary text-white">
          Tümü
        </Link>
        {categories?.map((cat) => (
          <Link
            key={cat.id}
            href={`/kategoriler/${cat.slug}`}
            className="px-4 py-1.5 rounded-full text-sm font-semibold border border-border text-text-light hover:border-primary hover:text-primary transition-colors"
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {!products?.length ? (
        <div className="text-center py-24 text-text-light">
          <p className="text-lg">Henüz ürün bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/urunler/${product.slug}`}
              className="group bg-white rounded-xl border border-border overflow-hidden hover:shadow-hover hover:border-primary transition-all"
            >
              <div className="aspect-square bg-bg flex items-center justify-center text-text-light text-sm">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span>Görsel yok</span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-text-light mb-0.5">{(product.category as unknown as { name: string } | null)?.name}</p>
                <h2 className="font-serif text-sm text-text group-hover:text-primary transition-colors line-clamp-1">
                  {product.name}
                </h2>
                <p className="mt-1.5 text-sm font-semibold text-primary">
                  {Number(product.basePrice).toLocaleString("tr-TR")} ₺
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
