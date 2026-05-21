import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

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
    title: category.name,
    description,
    openGraph: { title: category.name, description },
  };
}

export default async function KategoriPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, description, basePrice, images")
    .eq("categoryId", category.id)
    .order("createdAt", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <div className="mb-10">
        <p className="text-sm text-text-light mb-1">
          <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
          {" / "}
          <span>{category.name}</span>
        </p>
        <h1 className="font-serif text-3xl text-text">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-text-light">{category.description}</p>
        )}
      </div>

      {!products?.length ? (
        <div className="text-center py-24 text-text-light">
          <p className="text-lg">Bu kategoride henüz ürün bulunmuyor.</p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline text-sm font-semibold">
            Ana sayfaya dön
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/urunler/${product.slug}`}
              className="group bg-white rounded-xl border border-border overflow-hidden hover:shadow-hover hover:border-primary transition-all"
            >
              <div className="relative aspect-square bg-bg flex items-center justify-center text-text-light text-sm">
                {product.images?.[0] ? (
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                ) : (
                  <span>Görsel yok</span>
                )}
              </div>
              <div className="p-3">
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
