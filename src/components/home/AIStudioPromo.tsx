"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { type StudioTool } from "@/lib/studio";

const EXAMPLES = [
  { label: "Netleştir & Büyüt", icon: "🌟", before: "/IMG-20240703-WA0002a.jpg", after: "/anibaski-studyoa.png" },
  { label: "Pixar 3D Karakter", icon: "🧸", before: "/IMG-20240703-WA0002a.jpg", after: "/rahsan-serdar-pixar.png" },
  { label: "Pixel Art", icon: "🎮", before: "/deniz-once.jpeg", after: "/deniz-pixelart.png" },
];

function BeforeAfter({ example }: { example: typeof EXAMPLES[0] }) {
  const [sliderX, setSliderX] = useState(50);
  const [dragging, setDragging] = useState(false);

  function handleMove(clientX: number, rect: DOMRect) {
    const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setSliderX(pct);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-white/70 text-xs font-semibold">
        <span>{example.icon}</span> {example.label}
      </div>
      <div
        className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl select-none cursor-ew-resize"
        onMouseDown={(e) => { setDragging(true); handleMove(e.clientX, e.currentTarget.getBoundingClientRect()); }}
        onMouseMove={(e) => { if (dragging) handleMove(e.clientX, e.currentTarget.getBoundingClientRect()); }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onTouchStart={(e) => { setDragging(true); handleMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect()); }}
        onTouchMove={(e) => { if (dragging) handleMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect()); }}
        onTouchEnd={() => setDragging(false)}
      >
        {/* SONRA */}
        <img src={example.after} alt="AI sonrası" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        <div className="absolute bottom-2 right-2 text-[9px] font-bold text-white/90 tracking-widest uppercase bg-black/40 px-1.5 py-0.5 rounded pointer-events-none">SONRA</div>

        {/* ÖNCE */}
        <div className="absolute inset-0 pointer-events-none" style={{ clipPath: `inset(0 ${100 - sliderX}% 0 0)` }}>
          <img src={example.before} alt="Orijinal" className="w-full h-full object-cover" draggable={false} />
          <div className="absolute bottom-2 left-2 text-[9px] font-bold text-white/90 tracking-widest uppercase bg-black/40 px-1.5 py-0.5 rounded">ÖNCE</div>
        </div>

        {/* Handle */}
        <div className="absolute top-0 bottom-0 z-10 flex items-center justify-center pointer-events-none" style={{ left: `calc(${sliderX}% - 1px)` }}>
          <div className="w-0.5 h-full bg-white/70" />
          <div className="absolute w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3" />
            </svg>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white/15 text-xs tracking-wider select-none">← sürükle →</span>
        </div>
      </div>
    </div>
  );
}

export default function AIStudioPromo() {
  const [tools, setTools] = useState<StudioTool[]>([]);

  useEffect(() => {
    fetch("/api/ai/studio/tools")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: StudioTool[]) => setTools(d))
      .catch(() => {});
  }, []);

  return (
    <section className="py-24 px-4 sm:px-8 bg-text overflow-hidden relative">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto flex flex-col gap-14">

        {/* Üst — ortalı başlık */}
        <div className="text-center flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/40 bg-accent/10 text-accent text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
            YENİ · AI Stüdyo
          </div>

          <div>
            <h2 className="font-serif text-4xl md:text-5xl text-white leading-tight">
              Fotoğrafını baskıya{" "}
              <em className="not-italic text-accent">hazırla</em>
            </h2>
            <p className="mt-4 text-white/60 text-lg leading-relaxed max-w-xl mx-auto">
              Photoshop gerekmez. Netleştir, renklendir, Pixar karakterine veya pixel art'a dönüştür —
              yapay zeka saniyeler içinde halleder.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              href="/studyo"
              className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-all hover:-translate-y-0.5 shadow-lg"
            >
              AI Stüdyo&apos;yu Dene ✨
            </Link>
            <span className="text-white/40 text-xs">Her gün ücretsiz kredi · Baskıdan kredi kazan</span>
          </div>
        </div>

        {/* Üç before/after çerçeve */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {EXAMPLES.map((ex) => (
            <BeforeAfter key={ex.label} example={ex} />
          ))}
        </div>

        {/* Alt — araç kartları */}
        {tools.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {tools.map((t) => (
              <Link
                key={t.slug}
                href={t.active ? "/studyo" : "#"}
                className={`relative flex flex-col gap-2 rounded-2xl border p-4 transition-all ${
                  t.active
                    ? "bg-white/6 border-white/12 hover:bg-white/10 hover:border-white/25 hover:-translate-y-0.5"
                    : "bg-white/3 border-white/6 opacity-50 cursor-default pointer-events-none"
                }`}
              >
                <span className="text-2xl">{t.icon}</span>
                <p className="text-white text-sm font-semibold leading-tight">{t.name}</p>
                <p className="text-white/45 text-[11px] leading-snug">{t.description}</p>
                {!t.active && (
                  <span className="absolute top-3 right-3 text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                    YAKINDA
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
