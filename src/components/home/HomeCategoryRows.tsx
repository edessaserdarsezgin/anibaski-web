import Link from "next/link";
import Image from "next/image";
import PriceTag from "@/components/product/PriceTag";
import CardScroller from "@/components/ui/CardScroller";

type RowProduct = {
  id: string; name: string; slug: string; basePrice: number; images: string[] | null;
  discount_percent: number | null; discount_starts_at: string | null; discount_ends_at: string | null;
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
              <Link key={p.id} href={`/urunler/${p.slug}`}
                className="group shrink-0 w-44 bg-white rounded-2xl border border-border overflow-hidden hover:shadow-hover hover:border-primary/30 transition-all">
                <div className="relative aspect-square bg-bg overflow-hidden">
                  {p.images?.[0] && (
                    <Image src={p.images[0]} alt={p.name} fill sizes="176px"
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
      ))}
    </div>
  );
}
