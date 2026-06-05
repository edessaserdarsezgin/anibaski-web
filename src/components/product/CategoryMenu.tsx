"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export type MenuCategory = {
  id: string; name: string; slug: string;
  children: { id: string; name: string; slug: string }[];
};

const pill = "px-5 py-2 rounded-full text-sm font-semibold border transition-all";
const idle = "border-border text-text-light hover:border-primary hover:text-primary hover:bg-primary/5";

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
    <div ref={ref} className="flex gap-2 flex-wrap mb-12">
      <Link href={`/urunler${queryString}`} className={`${pill} bg-text text-white border-text`}>
        Tümü
      </Link>
      {categories.map((cat) => {
        if (cat.children.length === 0) {
          return (
            <Link key={cat.id} href={`/kategoriler/${cat.slug}${queryString}`} className={`${pill} ${idle}`}>
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
              className={`${pill} inline-flex items-center gap-1 ${open ? "border-primary text-primary bg-primary/5" : idle}`}
            >
              {cat.name}
              <span className={`text-xs transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>▾</span>
            </button>
            {open && (
              <div className="absolute left-0 top-full mt-2 z-20 min-w-[200px] bg-white border border-border rounded-2xl shadow-lg p-2">
                <Link
                  href={`/kategoriler/${cat.slug}${queryString}`}
                  onClick={() => setOpenId(null)}
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-text hover:bg-bg"
                >
                  Tüm {cat.name}
                </Link>
                {cat.children.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/kategoriler/${sub.slug}${queryString}`}
                    onClick={() => setOpenId(null)}
                    className="block px-3 py-2 rounded-lg text-sm text-text-light hover:bg-bg hover:text-primary"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
