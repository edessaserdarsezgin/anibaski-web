"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/hooks/useCart";

/**
 * Mobil alt navigasyon çubuğu — başparmak erişimi için 5 sekme.
 * Sadece mobilde görünür (md:hidden). Sepet sekmesinde canlı rozet.
 */
export default function MobileBottomNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const { count } = useCart();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const accountHref = isLoggedIn ? "/profil" : "/giris";
  const accountLabel = isLoggedIn ? "Hesabım" : "Giriş";

  const itemCls = (active: boolean) =>
    `relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-semibold transition-colors ${
      active ? "text-primary" : "text-text-light hover:text-text"
    }`;

  return (
    <nav
      aria-label="Mobil navigasyon"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch h-14">
        {/* Anasayfa */}
        <Link href="/" className={itemCls(isActive("/"))} aria-current={isActive("/") ? "page" : undefined}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
          </svg>
          Anasayfa
        </Link>

        {/* Kategoriler → Tüm Ürünler */}
        <Link href="/urunler" className={itemCls(isActive("/urunler"))} aria-current={isActive("/urunler") ? "page" : undefined}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          Kategoriler
        </Link>

        {/* Favoriler */}
        <Link href="/favorilerim" className={itemCls(isActive("/favorilerim"))} aria-current={isActive("/favorilerim") ? "page" : undefined}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          Favoriler
        </Link>

        {/* Sepet */}
        <Link href="/sepet" className={itemCls(isActive("/sepet"))} aria-current={isActive("/sepet") ? "page" : undefined}>
          <span className="relative">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
            </svg>
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </span>
          Sepet
        </Link>

        {/* Hesap / Giriş */}
        <Link href={accountHref} className={itemCls(isActive(accountHref))} aria-current={isActive(accountHref) ? "page" : undefined}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {accountLabel}
        </Link>
      </div>
    </nav>
  );
}
