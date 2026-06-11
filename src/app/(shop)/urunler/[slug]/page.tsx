import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AddToCartButton from "./AddToCartButton";
import RelatedProducts, { type RelatedProduct } from "@/components/product/RelatedProducts";
import { activeDiscountPercent } from "@/lib/pricing";
import ProductGallery from "./ProductGallery";
import ProductDetailsTabs from "./ProductDetailsTabs";
import ShippingEstimate from "./ShippingEstimate";
import { getShippingSettings } from "@/lib/shipping";
import {
  getProductBySlug,
  getProductVariants,
  getRelatedProductsSameCategory,
  getRelatedProductsFallback
} from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const description = product.description
    ? String(product.description).slice(0, 155)
    : `${product.name} — AnıBaskı'da fotoğraf baskısı ve kişiye özel hediye seçenekleri.`;
  return {
    title: `${product.name} | AnıBaskı`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function UrunDetayPage({ params }: Props) {
  noStore();
  const { slug } = await params;
  const supabase = await createClient();

  const [product, { data: { user } }] = await Promise.all([
    getProductBySlug(slug),
    supabase.auth.getUser(),
  ]);

  if (!product) notFound();

  const adminDb = createAdminClient();

  // product elde edildikten sonra kalan sorgular paralel.
  const [favRes, shippingInfo, sameCatProds, variants] = await Promise.all([
    user
      ? adminDb.from("favorites").select("id").eq("userId", user.id).eq("productId", product.id).maybeSingle()
      : Promise.resolve({ data: null }),
    getShippingSettings(),
    getRelatedProductsSameCategory(product.categoryId, product.id),
    getProductVariants(product.id),
  ]);

  const isFavorited = !!favRes.data;

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      // Sunucu bileşeni istek başına tek kez render edilir; ilgili ürünleri her
      // ziyarette çeşitlendirmek için kasıtlı rastgelelik (purity kuralı burada
      // geçerli değil — client re-render yok).
      // eslint-disable-next-line react-hooks/purity
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const related: RelatedProduct[] = shuffle((sameCatProds ?? []) as unknown as RelatedProduct[]).slice(0, 8);
  if (related.length < 8) {
    const have = new Set<string>([product.id, ...related.map((r) => r.id)]);
    const fill = await getRelatedProductsFallback(product.id);
    for (const p of (fill ?? []) as unknown as RelatedProduct[]) {
      if (related.length >= 8) break;
      if (!have.has(p.id)) { related.push(p); have.add(p.id); }
    }
  }

  type RawVariant = { id: string; type: string; label: string; value: string; priceAddon?: unknown };

  const variantGroups = (variants ?? []).reduce<Record<string, RawVariant[]>>((acc, v) => {
    if (!acc[v.type]) acc[v.type] = [];
    acc[v.type].push(v);
    return acc;
  }, {});

  const category = product.category as unknown as { id: string; name: string; slug: string } | null;

  return (
    <>
      {/* ── Breadcrumb ──────────────────────────────── */}
      <div className="border-b border-border bg-bg">
        <div className="max-w-6xl mx-auto px-8 py-3.5">
          <p className="text-sm text-text-light flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-primary transition-colors">Ana Sayfa</Link>
            <span className="text-border">/</span>
            <Link href="/urunler" className="hover:text-primary transition-colors">Ürünler</Link>
            {category && (
              <>
                <span className="text-border">/</span>
                <Link href={`/kategoriler/${category.slug}`} className="hover:text-primary transition-colors">
                  {category.name}
                </Link>
              </>
            )}
            <span className="text-border">/</span>
            <span className="text-text truncate max-w-[200px]">{product.name}</span>
          </p>
        </div>
      </div>

      {/* ── İçerik ──────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-12 xl:gap-16">

          {/* Galeri */}
          <ProductGallery
            images={product.images ?? []}
            name={product.name}
            productId={product.id}
            isFavorited={isFavorited}
          />

          {/* Ürün bilgisi */}
          <div className="flex flex-col gap-5">
            {/* Kategori etiketi */}
            {category && (
              <div>
                <Link href={`/kategoriler/${category.slug}`}>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                    {category.name}
                  </span>
                </Link>
              </div>
            )}

            {/* Başlık */}
            <div>
              <h1 className="font-serif text-3xl md:text-4xl text-text leading-snug">{product.name}</h1>
              {(product.productTags as { tagId: string; tag: { name: string; color: string } }[] | null)?.length ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(product.productTags as { tagId: string; tag: { name: string; color: string } }[]).map((pt) => (
                    <span
                      key={pt.tagId}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: pt.tag.color }}
                    >
                      {pt.tag.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Fiyat ve aksiyon */}
            <AddToCartButton
              isLoggedIn={!!user}
              product={{
                id: product.id,
                name: product.name,
                basePrice: Number(product.basePrice),
                image: product.images?.[0] ?? "",
                requiresPhotoUpload: product.requiresPhotoUpload ?? false,
                photoCount: product.photoCount ?? 1,
                mockupTemplateUrl: product.mockupTemplateUrl ?? null,
              }}
              discountPercent={activeDiscountPercent({
                discount_percent: product.discount_percent ?? null,
                discount_starts_at: product.discount_starts_at ?? null,
                discount_ends_at: product.discount_ends_at ?? null,
              })}
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

            {/* Ne zaman kargoda? — dinamik tahmin */}
            <ShippingEstimate
              cutoffHour={shippingInfo.dispatchCutoffHour}
              dispatchBusinessDays={shippingInfo.dispatchBusinessDays}
            />

            {/* Kargo & Teslimat */}
            <div className="rounded-2xl border border-border bg-bg p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-text-light uppercase tracking-wide">Kargo & Teslimat</p>
              <div className="flex items-center gap-4">
                {[
                  { icon: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", label: "Üretim", value: shippingInfo.productionTime },
                  { icon: "M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H3m16.5 0h-.75m-7.5 0h6m-6 0V5.625A2.625 2.625 0 0 1 12.375 3h3.75A2.625 2.625 0 0 1 18.75 5.625V18.75m-10.5 0V9.375A2.625 2.625 0 0 1 10.875 6.75h3.75", label: "Kargo", value: shippingInfo.shippingTime },
                  { icon: "M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z", label: "Ücretsiz", value: `${shippingInfo.freeShippingThreshold.toLocaleString("tr-TR")} ₺ üzeri` },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                    <p className="text-[10px] text-text-light leading-none">{label}</p>
                    <p className="text-xs font-semibold text-text leading-tight">{value}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-text-light border-t border-border pt-2.5">
                {shippingInfo.orderCutoffNote}
              </p>
            </div>

            {/* Güven rozeti */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
              {[
                {
                  label: "Ücretsiz Kargo",
                  sub: `${shippingInfo.freeShippingThreshold.toLocaleString("tr-TR")}₺ üzeri`,
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H3m16.5 0h-.75m-7.5 0h6m-6 0V5.625A2.625 2.625 0 0112.375 3h3.75A2.625 2.625 0 0118.75 5.625V18.75m-10.5 0V9.375A2.625 2.625 0 0110.875 6.75h3.75" />
                  ),
                },
                {
                  label: "Güvenli Ödeme",
                  sub: "SSL korumalı",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  ),
                },
                {
                  label: "Kolay İade",
                  sub: "14 gün garantisi",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  ),
                },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-2xl bg-bg border border-border">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    {item.icon}
                  </svg>
                  <p className="text-xs font-semibold text-text leading-tight">{item.label}</p>
                  <p className="text-[10px] text-text-light">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <ProductDetailsTabs
          specs={product.specs as Parameters<typeof ProductDetailsTabs>[0]["specs"]}
          description={product.description ?? ""}
        />
      </div>

      <RelatedProducts products={related} />
    </>
  );
}
