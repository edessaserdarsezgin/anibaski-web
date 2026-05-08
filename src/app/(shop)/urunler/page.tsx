import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Tüm Ürünler | AnıBaskı" };

export default async function UrunlerPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <div className="mb-10">
        <h1 className="font-serif text-3xl text-[var(--color-text)]">Tüm Ürünler</h1>
        <p className="mt-2 text-[var(--color-text-light)]">
          {products.length} ürün listeleniyor
        </p>
      </div>

      <div className="flex gap-2 flex-wrap mb-8">
        <Link
          href="/urunler"
          className="px-4 py-1.5 rounded-full text-sm font-semibold border border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
        >
          Tümü
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/kategoriler/${cat.slug}`}
            className="px-4 py-1.5 rounded-full text-sm font-semibold border border-[var(--color-border)] text-[var(--color-text-light)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24 text-[var(--color-text-light)]">
          <p className="text-lg">Henüz ürün bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/urunler/${product.slug}`}
              className="group bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden hover:shadow-[var(--shadow-hover)] hover:border-[var(--color-primary)] transition-all"
            >
              <div className="aspect-square bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-text-light)] text-sm">
                {product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span>Görsel yok</span>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs text-[var(--color-text-light)] mb-1">{product.category.name}</p>
                <h2 className="font-serif text-lg text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                  {product.name}
                </h2>
                {product.description && (
                  <p className="mt-1 text-sm text-[var(--color-text-light)] line-clamp-2">{product.description}</p>
                )}
                <p className="mt-3 font-semibold text-[var(--color-primary)]">
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
