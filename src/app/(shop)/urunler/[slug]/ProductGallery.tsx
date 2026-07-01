"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [lightbox, setLightbox] = useState(false);

  const showPrev = useCallback(() => setActive((i) => (i - 1 + images.length) % images.length), [images.length]);
  const showNext = useCallback(() => setActive((i) => (i + 1) % images.length), [images.length]);

  // Lightbox açıkken: klavye gezinme + body scroll kilidi
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      else if (e.key === "ArrowLeft") showPrev();
      else if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox, showPrev, showNext]);

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
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Görseli büyüt"
          className="absolute inset-0 z-0 cursor-zoom-in group"
        >
          <Image
            src={images[active]}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          {/* Büyüteç ipucu — sağ alt */}
          <span className="absolute bottom-3 left-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3d405b" strokeWidth={1.75} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3m1.8-4.45a6.25 6.25 0 1 1-12.5 0 6.25 6.25 0 0 1 12.5 0ZM10.45 8.2v4.5M8.2 10.45h4.5" />
            </svg>
          </span>
        </button>

        {/* Favori butonu — sağ üst köşe overlay */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(); }}
          disabled={favLoading}
          aria-label={favorited ? "Favorilerden çıkar" : "Favorilere ekle"}
          className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white flex items-center justify-center transition-all disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5"
            fill={favorited ? "#e07a5f" : "none"}
            stroke={favorited ? "#e07a5f" : "#8187a2"}
            strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {/* Görsel üstü gezinme okları (büyütmeden) — birden fazla görselde */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); showPrev(); }}
              aria-label="Önceki görsel"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white flex items-center justify-center transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3d405b" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); showNext(); }}
              aria-label="Sonraki görsel"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white flex items-center justify-center transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3d405b" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}
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

      {/* Lightbox — tam ekran önizleme */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} görsel önizleme`}
        >
          {/* Kapat */}
          <button
            onClick={() => setLightbox(false)}
            aria-label="Kapat"
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Görsel */}
          <div className="relative w-full h-full max-w-5xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[active]}
              alt={name}
              fill
              className="object-contain select-none"
              sizes="100vw"
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); showPrev(); }}
                aria-label="Önceki görsel"
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); showNext(); }}
                aria-label="Sonraki görsel"
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-white/10 rounded-full px-3 py-1">
                {active + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
