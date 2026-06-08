import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import CardScroller from "@/components/ui/CardScroller";

type RowProduct = {
  id: string; name: string; slug: string; basePrice: number; images: string[] | null;
  discount_percent: number | null; discount_starts_at: string | null; discount_ends_at: string | null;
  productTags?: { tagId: string; position: string; tag: { name: string; color: string } }[] | null;
};
type Row = { id: string; name: string; slug: string; products: RowProduct[] };

export default function HomeCategoryRows({ rows }: { rows: Row[] }) {
  return (
    <div className="flex flex-col gap-14">
      {rows.map((row) => (
        <div key={row.id}>
          <div className="flex items-end justify-between mb-5">
            <h3 className="font-serif text-2xl text-text">{row.name}</h3>
            <Link href={`/kategoriler/${row.slug}`} className="text-sm font-semibold text-text-light hover:text-primary transition-colors">
              Tümünü gör →
            </Link>
          </div>
          <CardScroller>
            {row.products.map((p) => (
              <ProductCard key={p.id} variant="strip" product={p} />
            ))}
          </CardScroller>
        </div>
      ))}
    </div>
  );
}
