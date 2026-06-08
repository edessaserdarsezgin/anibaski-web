import ProductCard from "@/components/product/ProductCard";
import CardScroller from "@/components/ui/CardScroller";

export type RelatedProduct = {
  id: string; name: string; slug: string; basePrice: number; images: string[] | null;
  discount_percent: number | null; discount_starts_at: string | null; discount_ends_at: string | null;
};

export default function RelatedProducts({ products }: { products: RelatedProduct[] }) {
  if (!products.length) return null;
  return (
    <section className="py-16 px-8 bg-white border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-2">Keşfet</p>
          <h2 className="font-serif text-3xl md:text-4xl text-text">Benzer Ürünler</h2>
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
