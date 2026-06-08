import ProductCard from "@/components/product/ProductCard";
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
            <h2 className="font-serif text-3xl md:text-4xl text-text">Öne Çıkanlar</h2>
          </div>
        </div>
        <CardScroller>
          {products.map((p) => (
            <ProductCard key={p.id} variant="strip" product={p} />
          ))}
        </CardScroller>
      </div>
    </section>
  );
}
