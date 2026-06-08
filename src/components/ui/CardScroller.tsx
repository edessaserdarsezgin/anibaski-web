"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Yatay kart şeridi — scrollbar gizli, masaüstünde sağa/sola ok butonlarıyla
 * kaydırılır; mobilde parmakla kaydırma korunur. Uçlardaki ok pasifleşir.
 */
export default function CardScroller({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  function scrollByDir(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const arrowBase =
    "hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-border shadow-md items-center justify-center text-text hover:bg-primary hover:text-white hover:border-primary transition-all";

  return (
    <div className="relative">
      <div
        ref={ref}
        className={`no-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-2 pb-2 -mx-2 px-2 ${className}`}
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => scrollByDir(-1)}
        aria-label="Geriye kaydır"
        className={`${arrowBase} left-0 ${canLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => scrollByDir(1)}
        aria-label="İleriye kaydır"
        className={`${arrowBase} right-0 ${canRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        →
      </button>
    </div>
  );
}
