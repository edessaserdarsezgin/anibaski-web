import ProductCard from "@/components/product/ProductCard";
import CardScroller from "@/components/ui/CardScroller";
import CountdownTimer from "./CountdownTimer";

type FlashProduct = {
  id: string; name: string; slug: string; basePrice: number; images: string[] | null;
  discount_percent: number | null; discount_starts_at: string | null; discount_ends_at: string | null;
  productTags?: { tagId: string; position: string; tag: { name: string; color: string } }[] | null;
};

export default function FlashDealsStrip({ products, endsAt }: { products: FlashProduct[]; endsAt: string | null }) {
  if (!products.length) return null;
  return (
    <section className="py-20 px-4 sm:px-8 bg-bg">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-2">Kaçırmayın</p>
            <h2 className="font-serif text-3xl md:text-4xl text-text">Süreli Fırsatlar</h2>
          </div>
          {endsAt && <CountdownTimer endsAt={endsAt} />}
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
