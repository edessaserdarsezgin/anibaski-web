"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import CardScroller from "@/components/ui/CardScroller";
import { readRecentlyViewed, type RecentItem } from "@/hooks/useRecentlyViewed";

export default function RecentlyViewed() {
  const [items, setItems] = useState<RecentItem[] | null>(null);
  useEffect(() => {
    // localStorage yalnız client'ta var; SSR-güvenli okuma için mount sonrası tek sefer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readRecentlyViewed());
  }, []);

  if (!items || items.length === 0) return null;
  return (
    <section className="py-20 px-4 sm:px-8 bg-white border-y border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-2">Kaldığın yerden</p>
          <h2 className="font-serif text-3xl md:text-4xl text-text">Son Baktıkların</h2>
        </div>
        <CardScroller>
          {items.map((it) => (
            <ProductCard
              key={it.slug}
              variant="strip"
              product={{
                id: it.slug,
                name: it.name,
                slug: it.slug,
                basePrice: it.price,
                images: it.image ? [it.image] : [],
                discount_percent: null,
                discount_starts_at: null,
                discount_ends_at: null,
              }}
            />
          ))}
        </CardScroller>
      </div>
    </section>
  );
}
