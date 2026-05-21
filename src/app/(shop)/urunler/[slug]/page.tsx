import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AddToCartButton from "./AddToCartButton";
import ProductGallery from "./ProductGallery";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("name").eq("slug", slug).single();
  if (!product) return {};
  return { title: `${product.name} | AnıBaskı` };
}

export default async function UrunDetayPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: { user } }] = await Promise.all([
    supabase.from("products").select("*, category:categories(id, name, slug)").eq("slug", slug).single(),
    supabase.auth.getUser(),
  ]);

  if (!product) notFound();

  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, type, label, value, priceAddon")
    .eq("productId", product.id)
    .order("type");

  type RawVariant = { id: string; type: string; label: string; value: string; priceAddon?: unknown };

  const variantGroups = (variants ?? []).reduce<Record<string, RawVariant[]>>((acc, v) => {
    if (!acc[v.type]) acc[v.type] = [];
    acc[v.type].push(v);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <p className="text-sm text-text-light mb-8">
        <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
        {" / "}
        <Link href={`/kategoriler/${product.category.slug}`} className="hover:text-primary">
          {product.category.name}
        </Link>
        {" / "}
        <span>{product.name}</span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <ProductGallery images={product.images ?? []} name={product.name} />

        <div className="flex flex-col">
          <p className="text-sm text-text-light mb-1">{product.category.name}</p>
          <h1 className="font-serif text-3xl text-text mb-3">{product.name}</h1>

          {product.description && (
            <p className="text-text-light mb-6">{product.description}</p>
          )}

          <AddToCartButton
            isLoggedIn={!!user}
            product={{
              id: product.id,
              name: product.name,
              basePrice: Number(product.basePrice),
              image: product.images?.[0] ?? "",
              requiresPhotoUpload: product.requiresPhotoUpload ?? false,
              photoCount: product.photoCount ?? 1,
            }}
            variantGroups={Object.entries(variantGroups).map(([type, items]) => ({
              type,
              items: items.map((v) => ({
                id: v.id,
                label: v.label,
                value: v.value,
                priceAddon: Number(v.priceAddon ?? 0),
              })),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
