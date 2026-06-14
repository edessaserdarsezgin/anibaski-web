import ProductCard from "@/components/product/ProductCard";
import CardScroller from "@/components/ui/CardScroller";

type RP = {
  id: string; name: string; slug: string; basePrice: number; images: string[] | null;
  discount_percent: number | null; discount_starts_at: string | null; discount_ends_at: string | null;
  productTags?: { tagId: string; position: string; tag: { name: string; color: string } }[] | null;
};

export default function ReprintStrip({ products }: { products: RP[] }) {
  if (!products.length) return null;
  return (
    <section className="py-20 px-4 sm:px-8 bg-bg">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-2">Sana özel</p>
          <h2 className="font-serif text-3xl md:text-4xl text-text">Tekrar Bas</h2>
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
