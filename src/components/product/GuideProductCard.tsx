"use client";

import Link from "next/link";
import Image from "next/image";
import PriceTag from "@/components/product/PriceTag";
import type { DiscountFields } from "@/lib/pricing";

export type ResolvedGuideProduct = {
  name: string;
  slug: string;
  basePrice: number;
  image: string | null;
  discount: DiscountFields;
};

type Props = {
  icon: string;
  scenario: string;
  blurb: string;
  product: ResolvedGuideProduct | null;
  categorySlug: string;
};

export default function GuideProductCard({ icon, scenario, blurb, product, categorySlug }: Props) {
  const href = product ? `/urunler/${product.slug}` : `/kategoriler/${categorySlug}`;
  return (
    <Link
      href={href}
      onClick={() => sessionStorage.setItem("source", "guided")}
      className="group flex flex-col bg-white rounded-2xl border border-border overflow-hidden hover:shadow-soft hover:border-primary/30 transition-all"
    >
      {product?.image && (
        <div className="relative w-full h-40 bg-bg">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover group-hover:scale-[1.03] transition-transform"
          />
        </div>
      )}
      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <p className="text-sm font-semibold text-text">{scenario}</p>
        </div>
        <p className="text-sm text-text-light leading-relaxed">{blurb}</p>
        <div className="mt-auto pt-2 flex flex-col gap-1">
          {product && <p className="text-xs text-text-light">{product.name}</p>}
          {product ? (
            <div className="flex items-center justify-between gap-2">
              <PriceTag basePrice={product.basePrice} discount={product.discount} />
              <span className="text-sm font-semibold text-primary group-hover:underline shrink-0">İncele →</span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-primary group-hover:underline">Ürünlere göz at →</span>
          )}
        </div>
      </div>
    </Link>
  );
}
