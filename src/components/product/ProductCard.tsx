import Link from "next/link";
import Image from "next/image";
import PriceTag from "@/components/product/PriceTag";

type ProductTagItem = {
  tagId: string;
  position: string;
  tag: { name: string; color: string };
};

type Props = {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    basePrice: number;
    images?: string[] | null;
    category?: { name: string; slug: string } | null;
    productTags?: ProductTagItem[] | null;
    discount_percent?: number | null;
    discount_starts_at?: string | null;
    discount_ends_at?: string | null;
  };
  initialFavorited?: boolean;
  priority?: boolean;
  showDescription?: boolean;
  /** "grid" = tam kart (varsayılan); "strip" = yatay şeritler için kompakt kart */
  variant?: "grid" | "strip";
};

export default function ProductCard({ product, priority = false, showDescription = false, variant = "grid" }: Props) {

  // Kompakt şerit kartı — yatay kaydırıcılarda (ana sayfa, benzer ürünler) kullanılır.
  // Grid kartıyla aynı görsel kimlik (serif isim, kare görsel, p-4, line-clamp-2); sadece dar ve favori/etiketsiz.
  if (variant === "strip") {
    return (
      <Link
        href={`/urunler/${product.slug}`}
        className="group block shrink-0 snap-start w-[calc(45.45%-1rem)] sm:w-[calc(31.25%-1rem)] lg:w-[calc(22.22%-1rem)] bg-white rounded-3xl border border-border overflow-hidden hover:shadow-hover hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
      >
        <div className="relative aspect-square bg-bg overflow-hidden">
          {product.images?.[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width:1024px) 240px, (min-width:640px) 220px, 45vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
        </div>
        <div className="p-4">
          <h2 className="font-serif text-sm text-text line-clamp-3 leading-snug mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h2>
          <PriceTag
            basePrice={Number(product.basePrice)}
            discount={{
              discount_percent: product.discount_percent ?? null,
              discount_starts_at: product.discount_starts_at ?? null,
              discount_ends_at: product.discount_ends_at ?? null,
            }}
            suffix="den itibaren"
          />
        </div>
      </Link>
    );
  }

  return (
    <div className="group h-full">
      <Link
        href={`/urunler/${product.slug}`}
        className="flex flex-col h-full bg-white rounded-3xl border border-border overflow-hidden hover:shadow-hover hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
      >
        {/* Görsel */}
        <div className="relative aspect-square bg-bg overflow-hidden">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              priority={priority}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-border">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm0 0h.008v.008H13.5V12zm4.5-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs">Görsel yok</span>
            </div>
          )}
          {/* Renkli etiketler — konum bazlı gruplar */}
          {(["top-left", "bottom-left", "bottom-right"] as const).map((pos) => {
            const labels = product.productTags?.filter((pt) => pt.position === pos) ?? [];
            if (!labels.length) return null;
            const cls: Record<string, string> = {
              "top-left":    "absolute top-3 left-3 z-10 flex flex-col gap-1.5",
              "bottom-left": "absolute bottom-3 left-3 z-10 flex flex-col gap-1.5",
              "bottom-right":"absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1.5",
            };
            return (
              <div key={pos} className={cls[pos]}>
                {labels.map((pt) => (
                  <span
                    key={pt.tagId}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-md"
                    style={{ backgroundColor: pt.tag.color }}
                  >
                    {pt.tag.name}
                  </span>
                ))}
              </div>
            );
          })}
        </div>

        {/* Bilgi */}
        <div className="p-4 flex-1 flex flex-col">
          <h2 className="font-serif text-sm text-text group-hover:text-primary transition-colors line-clamp-3 leading-snug mb-2">
            {product.name}
          </h2>
          {showDescription && product.description && (
            <p className="text-xs text-text-light line-clamp-2 leading-relaxed mb-4">
              {product.description}
            </p>
          )}
          <div className="mt-auto pt-1">
            <PriceTag
              basePrice={Number(product.basePrice)}
              discount={{
                discount_percent: product.discount_percent ?? null,
                discount_starts_at: product.discount_starts_at ?? null,
                discount_ends_at: product.discount_ends_at ?? null,
              }}
              suffix="den itibaren"
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
