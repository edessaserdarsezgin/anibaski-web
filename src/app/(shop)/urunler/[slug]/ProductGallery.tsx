"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Props = {
  images: string[];
  name: string;
  productId: string;
  isFavorited: boolean;
};

export default function ProductGallery({ images, name, productId, isFavorited: initialFav }: Props) {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [favorited, setFavorited] = useState(initialFav);
  const [favLoading, setFavLoading] = useState(false);

  async function toggleFavorite() {
    setFavLoading(true);
    const prev = favorited;
    setFavorited(!prev);
    try {
      const res = await fetch(
        prev ? `/api/favorites?productId=${productId}` : "/api/favorites",
        {
          method: prev ? "DELETE" : "POST",
          ...(prev ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) }),
        }
      );
      if (res.status === 401) {
        setFavorited(prev);
        router.push(`/giris?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else if (!res.ok) {
        setFavorited(prev);
      }
    } catch {
      setFavorited(prev);
    } finally {
      setFavLoading(false);
    }
  }

  if (!images.length) {
    return (
      <div className="aspect-[4/3] bg-bg rounded-3xl border border-border flex flex-col items-center justify-center gap-3 text-border">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm4.5-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm text-text-light">Görsel yok</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Ana görsel */}
      <div className="relative aspect-[4/3] bg-bg rounded-3xl border border-border overflow-hidden">
        <Image
          src={images[active]}
          alt={name}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />

        {/* Favori butonu — sağ üst köşe overlay */}
        <button
          onClick={toggleFavorite}
          disabled={favLoading}
          aria-label={favorited ? "Favorilerden çıkar" : "Favorilere ekle"}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white flex items-center justify-center transition-all disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5"
            fill={favorited ? "#e07a5f" : "none"}
            stroke={favorited ? "#e07a5f" : "#8187a2"}
            strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>
      </div>

      {/* Küçük resimler */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-xl border-2 overflow-hidden transition-all ${
                i === active
                  ? "border-primary shadow-soft"
                  : "border-border hover:border-primary/50 opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={url} alt={`${name} ${i + 1}`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
