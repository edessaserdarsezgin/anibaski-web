"use client";

import Link from "next/link";
import { useState } from "react";

const TOOLS = [
  { icon: "🔍", label: "Çözünürlük Artırma", desc: "Eski veya küçük fotoğrafları baskıya hazır kaliteye yükselt" },
  { icon: "🎨", label: "Renk Canlandırma", desc: "Soluk veya solmuş renkleri yapay zeka ile geri getir" },
  { icon: "✨", label: "Gürültü Azaltma", desc: "Karanlıkta çekilmiş grenli fotoğrafları temizle" },
];

export default function AIStudioPromo() {
  const [sliderX, setSliderX] = useState(50);
  const [dragging, setDragging] = useState(false);

  function handleMove(clientX: number, rect: DOMRect) {
    const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setSliderX(pct);
  }

  return (
    <section className="py-24 px-4 sm:px-8 bg-text overflow-hidden relative">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Sol — metin */}
          <div className="flex flex-col gap-8 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full border border-accent/40 bg-accent/10 text-accent text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
              YENİ · AI Stüdyo
            </div>

            <div>
              <h2 className="font-serif text-4xl md:text-5xl text-white leading-tight">
                Fotoğrafını baskıya
                <br />
                <em className="not-italic text-accent">hazırla</em>
              </h2>
              <p className="mt-5 text-white/60 text-lg leading-relaxed max-w-md">
                Photoshop gerekmez. Yapay zeka, düşük çözünürlüklü ya da soluk fotoğraflarını
                baskıya layık kaliteye taşısın.
              </p>
            </div>

            <ul className="flex flex-col gap-4">
              {TOOLS.map((t) => (
                <li key={t.label} className="flex items-start gap-4">
                  <span className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-lg shrink-0">
                    {t.icon}
                  </span>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.label}</p>
                    <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{t.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3 flex-wrap pt-2">
              <Link
                href="/studyo"
                className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-all hover:-translate-y-0.5 shadow-lg"
              >
                AI Stüdyo'yu Dene ✨
              </Link>
              <span className="text-white/40 text-xs">Her gün ücretsiz kredi · Baskıdan kredi kazan</span>
            </div>
          </div>

          {/* Sağ — interaktif before/after mockup */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative w-full max-w-[440px] aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl select-none"
              onMouseDown={(e) => {
                setDragging(true);
                handleMove(e.clientX, e.currentTarget.getBoundingClientRect());
              }}
              onMouseMove={(e) => {
                if (dragging) handleMove(e.clientX, e.currentTarget.getBoundingClientRect());
              }}
              onMouseUp={() => setDragging(false)}
              onMouseLeave={() => setDragging(false)}
              onTouchStart={(e) => {
                setDragging(true);
                handleMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
              }}
              onTouchMove={(e) => {
                if (dragging) handleMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
              }}
              onTouchEnd={() => setDragging(false)}
            >
              {/* AFTER (arkaplan - canlı) */}
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(135deg, #fde68a 0%, #f97316 35%, #e07a5f 65%, #9333ea 100%)" }}>
                <div className="absolute inset-0 opacity-30"
                  style={{ backgroundImage: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(255,200,100,0.3) 0%, transparent 40%)" }} />
                <div className="absolute bottom-3 right-3 text-[10px] font-bold text-white/70 tracking-widest uppercase">SONRA</div>
              </div>

              {/* BEFORE (klip ile kesili - soluk) */}
              <div className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - sliderX}% 0 0)`, background: "linear-gradient(135deg, #c8b89a 0%, #a89070 35%, #907560 65%, #6b5a80 100%)", filter: "saturate(0.3) brightness(0.75) blur(0.5px)" }}>
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23000' opacity='0.1'/%3E%3C/svg%3E\")" }} />
                <div className="absolute bottom-3 left-3 text-[10px] font-bold text-white/50 tracking-widest uppercase">ÖNCE</div>
              </div>

              {/* Slider handle */}
              <div className="absolute top-0 bottom-0 z-10 flex items-center justify-center pointer-events-none"
                style={{ left: `calc(${sliderX}% - 1px)` }}>
                <div className="w-0.5 h-full bg-white/70" />
                <div className="absolute w-9 h-9 rounded-full bg-white shadow-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3" />
                  </svg>
                </div>
              </div>

              {/* Hint */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-white/20 text-xs font-medium tracking-wider select-none">
                  ← sürükle →
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
