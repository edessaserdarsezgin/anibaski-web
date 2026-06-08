"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { MenuCategory } from "./HeaderCategoryBar";

interface Props {
  email?: string;
  isAdmin: boolean;
  categories?: MenuCategory[];
}

export default function MobileMenu({ email, isAdmin, categories = [] }: Props) {
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

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
              <Link
                href="/urunler"
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-semibold text-text hover:text-primary transition-colors border-b border-border"
              >
                Tüm Ürünler
              </Link>

              {categories.length > 0 && (
                <div className="py-2 border-b border-border">
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
                  className="py-3 text-sm font-semibold text-primary hover:text-primary/80 transition-colors border-b border-border"
                >
                  Admin Paneli
                </Link>
              )}

              {email ? (
                <>
                  <Link
                    href="/profil"
                    onClick={() => setOpen(false)}
                    className="py-3 text-sm font-semibold text-text hover:text-primary transition-colors border-b border-border"
                  >
                    Profilim
                  </Link>
                  <Link
                    href="/siparisler"
                    onClick={() => setOpen(false)}
                    className="py-3 text-sm font-semibold text-text hover:text-primary transition-colors border-b border-border"
                  >
                    Siparişlerim
                  </Link>
                  <div className="pt-3 pb-1">
                    <p className="text-xs text-text-light mb-3 truncate">{email}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSignOut(); }}
                      className="w-full py-2.5 text-sm font-semibold text-red-500 border border-red-200 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Çıkış Yap
                    </button>
                  </div>
                </>
              ) : (
                <div className="pt-4 pb-1 flex flex-col gap-2">
                  <Link
                    href="/giris"
                    onClick={() => setOpen(false)}
                    className="w-full py-2.5 text-center text-sm font-semibold bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/kayit"
                    onClick={() => setOpen(false)}
                    className="w-full py-2.5 text-center text-sm font-semibold border border-border text-text rounded-full hover:border-primary hover:text-primary transition-colors"
                  >
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
