"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export type MenuCategory = {
  id: string; name: string; slug: string; imageUrl?: string | null;
  children: { id: string; name: string; slug: string }[];
};

const base =
  "group/pill relative inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-300";
const idle =
  "border-border bg-white/60 text-text-light hover:text-primary hover:border-primary/40 hover:bg-white hover:shadow-soft hover:-translate-y-0.5";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
      className={`w-3.5 h-3.5 transition-all duration-300 ${open ? "rotate-180 text-primary" : "text-text-light/60 group-hover/pill:text-primary"}`}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" />
    </svg>
  );
}

export default function CategoryMenu({ categories, queryString }: { categories: MenuCategory[]; queryString: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenId(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="mb-12">
      <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-text-light/70 mb-3 ml-1">
        Kategoriler
      </p>
      <div className="flex gap-2.5 flex-wrap">
        <Link
          href={`/urunler${queryString}`}
          className={`${base} bg-text text-white border-text hover:-translate-y-0.5 hover:shadow-soft`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden />
          Tümü
        </Link>

        {categories.map((cat) => {
          if (cat.children.length === 0) {
            return (
              <Link key={cat.id} href={`/kategoriler/${cat.slug}${queryString}`} className={`${base} ${idle}`}>
                {cat.name}
              </Link>
            );
          }
          const open = openId === cat.id;
          return (
            <div key={cat.id} className="relative">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : cat.id)}
                aria-expanded={open}
                className={`${base} ${open ? "border-primary/50 text-primary bg-primary/5 shadow-soft" : idle}`}
              >
                {cat.name}
                <Chevron open={open} />
              </button>

              {open && (
                <div className="dropdown-enter absolute left-0 top-full mt-3 z-30 min-w-[248px] origin-top">
                  <div className="absolute -top-1.5 left-7 w-3 h-3 rotate-45 bg-white border-l border-t border-border" />
                  <div className="relative bg-white border border-border rounded-2xl shadow-hover p-2.5">
                    {/* Başlık — kategori görseli (varsa) */}
                    {cat.imageUrl && (
                      <div className="flex items-center gap-3 px-2 pb-2.5 mb-1 border-b border-border/60">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-bg border border-border shrink-0">
                          <Image src={cat.imageUrl} alt={cat.name} fill sizes="40px" className="object-cover" />
                        </div>
                        <p className="font-serif text-[15px] text-text leading-tight">{cat.name}</p>
                      </div>
                    )}

                    {/* Alt kategoriler */}
                    {cat.children.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/kategoriler/${sub.slug}${queryString}`}
                        onClick={() => setOpenId(null)}
                        className="group/item flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-text-light hover:text-primary hover:bg-bg transition-all"
                      >
                        <span className="w-1 h-4 rounded-full bg-transparent group-hover/item:bg-primary transition-colors" aria-hidden />
                        <span className="transition-transform duration-200 group-hover/item:translate-x-0.5">{sub.name}</span>
                      </Link>
                    ))}

                    {/* Tümünü gör — alt CTA */}
                    <div className="mt-1 pt-1 border-t border-border/70">
                      <Link
                        href={`/kategoriler/${cat.slug}${queryString}`}
                        onClick={() => setOpenId(null)}
                        className="group/all flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                      >
                        <span>Tüm {cat.name}</span>
                        <span className="transition-transform duration-200 group-hover/all:translate-x-0.5" aria-hidden>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
