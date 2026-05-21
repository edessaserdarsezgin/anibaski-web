import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CartCount from "./CartCount";
import UserMenu from "./UserMenu";
import MobileMenu from "./MobileMenu";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    isAdmin = profile?.role === "ADMIN";
  }

  return (
    <header className="sticky top-0 z-50 bg-bg border-b border-border">
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl text-text">
          Anı<span className="text-primary">Baskı</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-text-light">
          <Link href="/urunler" className="hover:text-text transition-colors">
            Ürünler
          </Link>
          {isAdmin && (
            <Link href="/admin" className="hover:text-text transition-colors text-primary">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/sepet"
            className="relative p-2 text-text hover:text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
            </svg>
            <CartCount />
          </Link>

          <div className="hidden md:block">
            {user ? (
              <UserMenu email={user.email!} />
            ) : (
              <Link
                href="/giris"
                className="ml-2 px-4 py-2 text-sm font-semibold rounded-full border border-border text-text hover:border-primary hover:text-primary transition-colors"
              >
                Giriş Yap
              </Link>
            )}
          </div>

          <MobileMenu email={user?.email ?? undefined} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
