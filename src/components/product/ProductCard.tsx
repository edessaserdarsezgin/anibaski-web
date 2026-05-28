"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Props = {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    basePrice: number;
    images?: string[] | null;
    category?: { name: string; slug: string } | null;
  };
  initialFavorited?: boolean;
  priority?: boolean;
};

export default function ProductCard({ product, initialFavorited = false, priority = false }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    const prev = favorited;
    setFavorited(!prev); // optimistic update
    try {
      const res = await fetch(
        prev ? `/api/favorites?productId=${product.id}` : "/api/favorites",
        {
          method: prev ? "DELETE" : "POST",
          ...(prev ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id }) }),
        }
      );
      if (res.status === 401) {
        setFavorited(prev); // geri al
        window.location.href = `/giris?redirect=${encodeURIComponent(window.location.pathname)}`;
      } else if (!res.ok) {
        setFavorited(prev); // geri al
      }
    } catch {
      setFavorited(prev);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative group">
      {/* Favori butonu */}
      <button
        onClick={toggleFavorite}
        disabled={loading}
        aria-label={favorited ? "Favorilerden çıkar" : "Favorilere ekle"}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-sm hover:scale-110 transition-transform disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-4 h-4"
          fill={favorited ? "#e07a5f" : "none"}
          stroke={favorited ? "#e07a5f" : "#8187a2"}
          strokeWidth={1.75}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      </button>

      <Link
        href={`/urunler/${product.slug}`}
        className="block bg-white rounded-3xl border border-border overflow-hidden hover:shadow-hover hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
      >
        {/* Görsel */}
        <div className="relative aspect-[4/3] bg-bg overflow-hidden">
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
          {/* Kategori etiketi — görsel üzerinde */}
          {product.category && (
            <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-text-light border border-white/50">
              {product.category.name}
            </span>
          )}
        </div>

        {/* Bilgi */}
        <div className="p-5">
          <h2 className="font-serif text-base text-text group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-3">
            {product.name}
          </h2>
          {product.description && (
            <p className="text-xs text-text-light line-clamp-2 leading-relaxed mb-4">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <p className="font-serif text-lg font-semibold text-primary">
              {Number(product.basePrice).toLocaleString("tr-TR")} ₺
              <span className="text-xs font-sans font-normal text-text-light ml-1">den itibaren</span>
            </p>
            <span className="w-8 h-8 rounded-full border border-border group-hover:border-primary group-hover:bg-primary flex items-center justify-center text-text-light group-hover:text-white transition-all text-sm">
              →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
