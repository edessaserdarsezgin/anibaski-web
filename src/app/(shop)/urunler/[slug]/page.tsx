import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import AddToCartButton from "./AddToCartButton";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return {};
  return { title: `${product.name} | AnıBaskı` };
}

export default async function UrunDetayPage({ params }: Props) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true, variants: true },
  });

  if (!product) notFound();

  // Varyantları tip bazında grupla
  const variantGroups = product.variants.reduce<Record<string, typeof product.variants>>((acc, v) => {
    if (!acc[v.type]) acc[v.type] = [];
    acc[v.type].push(v);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <p className="text-sm text-[var(--color-text-light)] mb-8">
        <Link href="/" className="hover:text-[var(--color-primary)]">Ana Sayfa</Link>
        {" / "}
        <Link href={`/kategoriler/${product.category.slug}`} className="hover:text-[var(--color-primary)]">
          {product.category.name}
        </Link>
        {" / "}
        <span>{product.name}</span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Görsel */}
        <div className="aspect-square bg-[var(--color-bg)] rounded-2xl border border-[var(--color-border)] flex items-center justify-center overflow-hidden">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[var(--color-text-light)] text-sm">Görsel yok</span>
          )}
        </div>

        {/* Bilgiler */}
        <div className="flex flex-col">
          <p className="text-sm text-[var(--color-text-light)] mb-1">{product.category.name}</p>
          <h1 className="font-serif text-3xl text-[var(--color-text)] mb-3">{product.name}</h1>

          {product.description && (
            <p className="text-[var(--color-text-light)] mb-6">{product.description}</p>
          )}

          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              basePrice: Number(product.basePrice),
            }}
            variantGroups={Object.entries(variantGroups).map(([type, items]) => ({
              type,
              items: items.map((v) => ({
                id: v.id,
                label: v.label,
                value: v.value,
                priceAddon: Number(v.priceAddon),
              })),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
