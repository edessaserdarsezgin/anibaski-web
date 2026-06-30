"use client";

import { useRef, useState } from "react";

export default function BeforeAfterSlider({
  before,
  after,
  aspectRatio: forcedRatio,
  fit = "cover",
}: {
  before: string;
  after: string;
  aspectRatio?: number;
  /** "cover" = kutuyu doldur (örnek/eşli görseller). "contain" = tam göster, kenar kesme (gerçek sonuç). */
  fit?: "cover" | "contain";
}) {
  const [pos, setPos] = useState(50);
  const [beforeRatio, setBeforeRatio] = useState<number | null>(null);
  const [afterRatio, setAfterRatio] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  function move(clientX: number) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }

  // Kutu oranı: zorlanmış oran > orijinalin (before) oranı > sonucun oranı.
  // Orijinalden alınca orijinal kendi oranında bozulmadan görünür; sonuç contain ile tam sığar.
  const boxRatio = forcedRatio ?? beforeRatio ?? afterRatio ?? 1;
  const imgFit = fit === "contain" ? "object-contain" : "object-cover";

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-2xl select-none bg-bg border border-border cursor-ew-resize"
      style={{ aspectRatio: boxRatio }}
      onMouseMove={(e) => e.buttons === 1 && move(e.clientX)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
      onClick={(e) => move(e.clientX)}
    >
      {/* Sonra (alt katman) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={after}
        alt="Sonra"
        onLoad={(e) => {
          const t = e.currentTarget;
          if (t.naturalHeight) setAfterRatio(t.naturalWidth / t.naturalHeight);
        }}
        className={`absolute inset-0 w-full h-full ${imgFit}`}
      />
      {/* Önce (üst katman) — clip-path ile kırpılır; aynı kutuyu doldurduğu için hizalı kalır */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={before}
        alt="Önce"
        onLoad={(e) => {
          const t = e.currentTarget;
          if (t.naturalHeight) setBeforeRatio(t.naturalWidth / t.naturalHeight);
        }}
        className={`absolute inset-0 w-full h-full ${imgFit}`}
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />
      {/* Tutamak */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-text text-xs">⇄</div>
      </div>
      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-semibold">Önce</span>
      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-semibold">Sonra</span>
    </div>
  );
}
