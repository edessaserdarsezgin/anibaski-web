"use client";

import { useRef, useState } from "react";

export default function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
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
      className="relative w-full aspect-square rounded-2xl overflow-hidden select-none bg-bg border border-border cursor-ew-resize"
      onMouseMove={(e) => e.buttons === 1 && move(e.clientX)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
      onClick={(e) => move(e.clientX)}
    >
      {/* Sonra (alt katman, tam) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt="Sonra" className="absolute inset-0 w-full h-full object-contain" />
      {/* Önce (üst katman, kırpılmış) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before}
          alt="Önce"
          className="absolute inset-0 h-full max-w-none object-contain"
          style={{ width: ref.current?.clientWidth ?? 0 }}
        />
      </div>
      {/* Tutamak */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-text text-xs">⇄</div>
      </div>
      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-semibold">Önce</span>
      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-semibold">Sonra</span>
    </div>
  );
}
