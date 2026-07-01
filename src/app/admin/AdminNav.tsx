"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Genel Bakış" },
  { href: "/admin/siparisler", label: "Siparişler" },
  { href: "/admin/uyeler", label: "Üyeler" },
  { href: "/admin/urunler", label: "Ürünler" },
  { href: "/admin/kategoriler", label: "Kategoriler" },
  { href: "/admin/etiketler", label: "Etiketler" },
  { href: "/admin/yorumlar", label: "Yorumlar" },
  { href: "/admin/soru-cevap", label: "Soru & Cevap" },
  { href: "/admin/indirim", label: "İndirim" },
  { href: "/admin/banner", label: "Duyuru Bandı" },
  { href: "/admin/kampanyalar", label: "Kampanyalar" },
  { href: "/admin/kargo-ayarlari", label: "Kargo Ayarları" },
  { href: "/admin/ai-kredi", label: "AI Kredi" },
  { href: "/admin/ai-araclar", label: "AI Araçlar" },
  { href: "/admin/firma-bilgileri", label: "Firma Bilgileri" },
  { href: "/admin/belgeler", label: "Belge Ayarları" },
  { href: "/admin/istatistik", label: "İstatistik" },
];

export default function AdminNav({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Sayfa değişince drawer kapat
  useEffect(() => { setOpen(false); }, [pathname]);

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/admin"
          ? pathname === "/admin"
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              active
                ? "bg-primary/10 text-primary"
                : "text-text-light hover:bg-bg hover:text-text"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-white border-r border-border flex-col shrink-0">
        <div className="px-6 h-16 flex items-center border-b border-border">
          <Link href="/" className="font-serif text-xl text-text">
            Anı<span className="text-primary">Baskı</span>
          </Link>
        </div>
        <NavLinks />
        <div className="px-6 py-4 border-t border-border">
          <p className="text-xs text-text-light truncate">{email}</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-border flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-bg transition-colors"
          aria-label="Menüyü aç"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="#3d405b" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <Link href="/" className="font-serif text-lg text-text">
          Anı<span className="text-primary">Baskı</span>
          <span className="text-xs text-text-light font-sans ml-2">Admin</span>
        </Link>
      </header>

      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-white flex flex-col shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 h-14 flex items-center justify-between border-b border-border shrink-0">
          <Link href="/" className="font-serif text-lg text-text">
            Anı<span className="text-primary">Baskı</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-bg transition-colors"
            aria-label="Menüyü kapat"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="#3d405b" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <NavLinks />
        <div className="px-6 py-4 border-t border-border shrink-0">
          <p className="text-xs text-text-light truncate">{email}</p>
        </div>
      </aside>
    </>
  );
}
