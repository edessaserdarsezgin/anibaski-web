"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect, useCallback } from "react";

type Banner = { id: string; image_url: string; title: string; subtitle: string | null; cta_text: string | null; cta_url: string };

export default function HeroBanner({ banners }: { banners: Banner[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = banners.length;
  const single = count <= 1;

  const scrollToIndex = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const next = (i + count) % count;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }, [count]);

  // Kaydırmaya göre aktif slide'ı izle (native swipe + programatik kaydırma ortak)
  function onScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  // Otomatik geçiş — hover/dokunuşta durur, tek banner'da kapalı
  useEffect(() => {
    if (single || paused) return;
    const id = setInterval(() => scrollToIndex(active + 1), 6000);
    return () => clearInterval(id);
  }, [single, paused, active, scrollToIndex]);

  if (!count) return (
    <section>
      <div className="relative w-full">
        <div className="relative w-full aspect-[21/9] min-h-[320px] md:min-h-[600px] overflow-hidden bg-gradient-to-br from-text via-text/90 to-primary/40 flex items-center">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #e07a5f 0%, transparent 50%), radial-gradient(circle at 80% 30%, #f2cc8f 0%, transparent 50%)" }} />
          <div className="relative px-8 md:px-14 max-w-xl flex flex-col gap-5">
            <h2 className="font-serif text-3xl md:text-5xl text-white leading-tight">
              Dijital anılarınızı<br />
              <em className="not-italic text-accent">dokunulur</em> kılın
            </h2>
            <p className="text-white/70 text-base md:text-lg">Telefonunuzda kalan kareler; baskıya, kitaba ve tabloya dönüşüyor.</p>
            <Link href="/urunler"
              className="self-start inline-flex items-center gap-2 px-6 py-3 bg-white text-text font-semibold rounded-full text-sm hover:gap-3 transition-all">
              Baskıya Başla <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="absolute bottom-4 right-6 flex gap-4 text-white/50 text-xs">
            {[["50.000+","Mutlu Müşteri"],["2–5 gün","Teslimat"],["4.9 ★","Puan"]].map(([n,l]) => (
              <div key={l} className="text-center">
                <p className="font-semibold text-white text-sm">{n}</p>
                <p>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <section>
      <div
        className="relative"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
      >
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
        >
          {banners.map((b) => (
            <Link key={b.id} href={b.cta_url}
              className="group relative shrink-0 w-full snap-center aspect-[21/9] min-h-[320px] md:min-h-[600px] overflow-hidden bg-bg">
              <Image src={b.image_url} alt={b.title} fill priority sizes="100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-text/65 via-text/25 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-14 max-w-xl">
                <h2 className="font-serif text-3xl md:text-5xl text-white mb-2 leading-tight">{b.title}</h2>
                {b.subtitle && <p className="text-white/85 text-sm md:text-lg mb-5">{b.subtitle}</p>}
                <span className="inline-flex self-start items-center gap-2 px-6 py-3 bg-white text-text font-semibold rounded-full text-sm group-hover:gap-3 transition-all">
                  {b.cta_text || "İncele"} <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {!single && (
          <>
            {/* Yan oklar */}
            <button
              type="button"
              aria-label="Önceki banner"
              onClick={() => scrollToIndex(active - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-text shadow-soft flex items-center justify-center transition-colors"
            >
              <span aria-hidden className="text-lg leading-none">‹</span>
            </button>
            <button
              type="button"
              aria-label="Sonraki banner"
              onClick={() => scrollToIndex(active + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-text shadow-soft flex items-center justify-center transition-colors"
            >
              <span aria-hidden className="text-lg leading-none">›</span>
            </button>

            {/* Nokta göstergeleri */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  aria-label={`${i + 1}. banner'a git`}
                  aria-current={i === active}
                  onClick={() => scrollToIndex(i)}
                  className={`h-2 rounded-full transition-all ${i === active ? "w-6 bg-white" : "w-2 bg-white/55 hover:bg-white/80"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
