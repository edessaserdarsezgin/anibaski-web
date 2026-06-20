"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { type StudioTool } from "@/lib/studio";

const EXAMPLES = [
  { label: "Anime", icon: "🌟", before: "/IMG-20240703-WA0002a.jpg", after: "/anibaski-studyoa.png" },
  { label: "Pixar 3D Karakter", icon: "🧸", before: "/IMG-20240703-WA0002a.jpg", after: "/rahsan-serdar-pixar.png" },
  { label: "Pixel Art", icon: "🎮", before: "/deniz-once.jpeg", after: "/deniz-pixelart.png" },
];

const PRINT_OPTIONS = [
  { icon: "🖼️", name: "Fotoğraf Baskısı", href: "/kategoriler/klasik-baskilar" },
  { icon: "🎨", name: "Kanvas Tablo", href: "/kategoriler/kanvas-tablolar" },
  { icon: "☕", name: "Kupa", href: "/kategoriler/kupalar" },
  { icon: "🪟", name: "Cam Baskı", href: "/kategoriler/cam-baski" },
  { icon: "🖼️", name: "Çerçeveli Baskı", href: "/kategoriler/cerceveler" },
  { icon: "🧲", name: "Magnet", href: "/kategoriler/magnetler" },
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
        <img src={example.after} alt="AI sonrası" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        <div className="absolute bottom-2 right-2 text-[9px] font-bold text-white/90 tracking-widest uppercase bg-black/40 px-1.5 py-0.5 rounded pointer-events-none">SONRA</div>

        <div className="absolute inset-0 pointer-events-none" style={{ clipPath: `inset(0 ${100 - sliderX}% 0 0)` }}>
          <img src={example.before} alt="Orijinal" className="w-full h-full object-cover" draggable={false} />
          <div className="absolute bottom-2 left-2 text-[9px] font-bold text-white/90 tracking-widest uppercase bg-black/40 px-1.5 py-0.5 rounded">ÖNCE</div>
        </div>

        <div className="absolute top-0 bottom-0 z-10 flex items-center justify-center pointer-events-none" style={{ left: `calc(${sliderX}% - 1px)` }}>
          <div className="w-0.5 h-full bg-white/70" />
          <div className="absolute w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3" />
            </svg>
          </div>
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
    <section className="py-20 px-4 sm:px-8 bg-text overflow-hidden relative">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto flex flex-col gap-12">

        {/* Başlık + akış + CTA */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-16">
          <div className="flex flex-col gap-5 lg:max-w-md">
            <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full border border-accent/40 bg-accent/10 text-accent text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
              YENİ · AI Stüdyo
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-white leading-tight">
              Fotoğrafını baskıya<br />
              <em className="not-italic text-accent">AI ile hazırla</em>
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Photoshop gerekmez. Fotoğrafını yapay zeka ile işle, beğenince tek tıkla baskıya gönder.
            </p>
            <Link
              href="/studyo"
              className="self-start px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full text-sm transition-all hover:-translate-y-0.5"
            >
              AI Stüdyo&apos;yu Dene ✨
            </Link>
          </div>

          {/* Adım akışı */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:flex-1">
            {[
              { icon: "📤", label: "Fotoğraf yükle" },
              { icon: "✨", label: "AI ile işle" },
              { icon: "🖨️", label: "Baskıya gönder", accent: true },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-medium ${
                  step.accent
                    ? "bg-primary/30 border border-primary/50 text-white"
                    : "bg-white/8 border border-white/12 text-white/80"
                }`}>
                  <span>{step.icon}</span>
                  <span>{step.label}</span>
                </div>
                {i < 2 && <span className="text-white/25 hidden sm:block">›</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Önce / Sonra örnekleri */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {EXAMPLES.map((ex) => (
            <BeforeAfter key={ex.label} example={ex} />
          ))}
        </div>

        {/* Araçlar + Baskı seçenekleri — kompakt alt şerit */}
        <div className="border-t border-white/10 pt-8 flex flex-col gap-6">

          {/* Araç pilleri */}
          {tools.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Araçlar</p>
              <div className="flex flex-wrap gap-2">
                {tools.map((t) => (
                  <span
                    key={t.slug}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      t.active
                        ? "bg-white/10 border-white/20 text-white hover:bg-white/15"
                        : "bg-white/4 border-white/8 text-white/30"
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.name}</span>
                    {!t.active && <span className="text-accent/60 text-[9px] font-bold">YAKINDA</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Baskı seçenekleri */}
          <div className="flex flex-col gap-3">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Ürün olarak al</p>
            <div className="flex flex-wrap gap-2">
              {PRINT_OPTIONS.map((opt) => (
                <Link
                  key={opt.name}
                  href={opt.href}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/8 border border-white/12 rounded-full text-white/80 text-sm hover:bg-white/14 hover:text-white transition-colors"
                >
                  <span className="text-base">{opt.icon}</span>
                  <span>{opt.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
