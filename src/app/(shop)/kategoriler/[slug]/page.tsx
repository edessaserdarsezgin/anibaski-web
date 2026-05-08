import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const categories = await prisma.category.findMany({ select: { slug: true } });
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return {};
  return { title: `${category.name} | AnıBaskı` };
}

export default async function KategoriPage({ params }: Props) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!category) notFound();

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <div className="mb-10">
        <p className="text-sm text-[var(--color-text-light)] mb-1">
          <Link href="/" className="hover:text-[var(--color-primary)]">Ana Sayfa</Link>
          {" / "}
          <span>{category.name}</span>
        </p>
        <h1 className="font-serif text-3xl text-[var(--color-text)]">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-[var(--color-text-light)]">{category.description}</p>
        )}
      </div>

      {category.products.length === 0 ? (
        <div className="text-center py-24 text-[var(--color-text-light)]">
          <p className="text-lg">Bu kategoride henüz ürün bulunmuyor.</p>
          <Link href="/" className="mt-4 inline-block text-[var(--color-primary)] hover:underline text-sm font-semibold">
            Ana sayfaya dön
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {category.products.map((product) => (
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
