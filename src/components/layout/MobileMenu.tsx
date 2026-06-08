"use client";

import { useState } from "react";
import Link from "next/link";
import type { MenuCategory } from "./HeaderCategoryBar";

interface Props {
  isAdmin: boolean;
  categories?: MenuCategory[];
}

/**
 * Mobil hamburger — KATALOG/ÖZELLİK menüsü.
 * Birincil gezinme (Anasayfa, Kategoriler, Favoriler, Sepet, Hesap) bottom-nav'da;
 * burada 5 sekmeye sığmayanlar var: kategori detayı + özel bölümler.
 */
export default function MobileMenu({ isAdmin, categories = [] }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden p-2 text-text hover:text-primary transition-colors cursor-pointer"
        aria-label="Menüyü aç"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 top-16 z-40 bg-black/20" onClick={() => setOpen(false)} />
          <div className="md:hidden fixed left-0 right-0 top-16 bottom-0 z-50 bg-bg border-b border-border shadow-hover overflow-y-auto overscroll-contain">
            <nav className="max-w-6xl mx-auto px-6 py-4 pb-24 flex flex-col">

              {categories.length > 0 && (
                <div className="pb-2 border-b border-border">
                  <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-text-light/70 py-1">Kategoriler</p>
                  {categories.map((cat) => (
                    <div key={cat.id} className="py-0.5">
                      <Link
                        href={`/kategoriler/${cat.slug}`}
                        onClick={() => setOpen(false)}
                        className="block py-1.5 text-sm font-semibold text-text hover:text-primary transition-colors"
                      >
                        {cat.name}
                      </Link>
                      {cat.children.length > 0 && (
                        <div className="pl-3 flex flex-col border-l border-border ml-1">
                          {cat.children.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/kategoriler/${sub.slug}`}
                              onClick={() => setOpen(false)}
                              className="py-1.5 pl-2 text-sm text-text-light hover:text-primary transition-colors"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Link
                href="/kategoriler/hazir-urunler"
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-semibold text-text hover:text-primary transition-colors border-b border-border"
              >
                Hazır Ürünler
              </Link>
              <Link
                href="/urun-rehberi"
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-semibold text-text hover:text-primary transition-colors border-b border-border"
              >
                Ürün Rehberi
              </Link>
              <Link
                href="/studyo"
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-semibold text-primary hover:text-primary/80 transition-colors border-b border-border"
              >
                AI Stüdyo
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="py-3 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Admin Paneli
                </Link>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
