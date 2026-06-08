import Link from "next/link";
import Image from "next/image";
import PriceTag from "@/components/product/PriceTag";
import CardScroller from "@/components/ui/CardScroller";

type FeatProduct = {
  id: string; name: string; slug: string; basePrice: number; images: string[] | null;
  discount_percent: number | null; discount_starts_at: string | null; discount_ends_at: string | null;
};

export default function FeaturedStrip({ products }: { products: FeatProduct[] }) {
  if (!products.length) return null;
  return (
    <section className="py-20 px-8 bg-white border-y border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-2">Seçtiklerimiz</p>
            <h2 className="font-serif text-4xl text-text">Öne Çıkanlar</h2>
          </div>
        </div>
        <CardScroller>
          {products.map((p) => (
            <Link key={p.id} href={`/urunler/${p.slug}`}
              className="group shrink-0 w-48 bg-white rounded-2xl border border-border overflow-hidden hover:shadow-hover hover:border-primary/30 transition-all">
              <div className="relative aspect-square bg-bg overflow-hidden">
                {p.images?.[0] && (
                  <Image src={p.images[0]} alt={p.name} fill sizes="192px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm text-text line-clamp-2 leading-snug mb-2 group-hover:text-primary transition-colors">{p.name}</p>
                <PriceTag basePrice={Number(p.basePrice)} discount={{ discount_percent: p.discount_percent, discount_starts_at: p.discount_starts_at, discount_ends_at: p.discount_ends_at }} />
              </div>
            </Link>
          ))}
        </CardScroller>
      </div>
    </section>
  );
}
