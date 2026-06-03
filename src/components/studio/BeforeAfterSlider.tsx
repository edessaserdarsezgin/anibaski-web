"use client";

import { useRef, useState } from "react";

export default function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const [ratio, setRatio] = useState<number | null>(null); // sonuç görselinin en/boy oranı
  const ref = useRef<HTMLDivElement>(null);

  function move(clientX: number) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-2xl select-none bg-bg border border-border cursor-ew-resize"
      style={{ aspectRatio: ratio ?? 1 }}
      onMouseMove={(e) => e.buttons === 1 && move(e.clientX)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
      onClick={(e) => move(e.clientX)}
    >
      {/* Sonra (alt katman) — kutu en/boy oranı bu görselden alınır, iki katman da aynı kutuyu doldurur */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={after}
        alt="Sonra"
        onLoad={(e) => {
          const t = e.currentTarget;
          if (t.naturalHeight) setRatio(t.naturalWidth / t.naturalHeight);
        }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Önce (üst katman) — clip-path ile kırpılır; aynı kutuyu doldurduğu için hizalı kalır */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={before}
        alt="Önce"
        className="absolute inset-0 w-full h-full object-cover"
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
