import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getReadyMadeCategoryIds } from "@/lib/readyMade";
import CartCount from "./CartCount";
import UserMenu from "./UserMenu";
import MobileMenu from "./MobileMenu";
import SearchBar from "./SearchBar";
import StudioCreditBadge from "./StudioCreditBadge";
import HeaderCategoryBar from "./HeaderCategoryBar";
import MobileBottomNav from "./MobileBottomNav";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    isAdmin = profile?.role === "ADMIN";
  }

  const adminDb = createAdminClient();
  const [{ data: cats }, readyMadeIds] = await Promise.all([
    adminDb.from("categories").select("id, name, slug, parentId, imageUrl").order("name"),
    getReadyMadeCategoryIds(),
  ]);
  const menuTree = (cats ?? [])
    .filter((c) => !c.parentId && !readyMadeIds.includes(c.id))
    .map((parent) => ({
      id: parent.id, name: parent.name, slug: parent.slug, imageUrl: (parent as { imageUrl?: string | null }).imageUrl ?? null,
      children: (cats ?? []).filter((c) => c.parentId === parent.id).map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    }));

  return (
    <>
    <header className="sticky top-0 z-50 bg-bg border-b border-border">
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl text-text">
          Anı<span className="text-primary">Baskı</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-text-light shrink-0">
          <Link href="/urunler" className="hover:text-text transition-colors">
            Ürünler
          </Link>
          <Link href="/kategoriler/hazir-urunler" className="hover:text-text transition-colors">
            Hazır Ürünler
          </Link>
          <Link href="/kampanyalar" className="hover:text-text transition-colors">
            Kampanyalar
          </Link>
          <Link href="/urun-rehberi" className="hover:text-text transition-colors">
            Rehber
          </Link>
          <Link href="/studyo" className="hover:text-text transition-colors text-primary">
            AI Stüdyo
          </Link>
          {isAdmin && (
            <Link href="/admin" className="hover:text-text transition-colors text-primary">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/favorilerim"
            aria-label="Favorilerim"
            className="p-2 text-text hover:text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </Link>

          <Link
            href="/sepet"
            className="relative p-2 text-text hover:text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
            </svg>
            <CartCount />
          </Link>

          {user && <StudioCreditBadge />}

          <div className="hidden md:flex items-center gap-2 ml-2">
            {user ? (
              <UserMenu email={user.email!} />
            ) : (
              <>
                <Link
                  href="/giris"
                  className="px-4 py-2 text-sm font-semibold rounded-full border border-border text-text hover:border-primary hover:text-primary transition-colors"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/kayit"
                  className="px-4 py-2 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary-hover transition-colors"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>

          <MobileMenu email={user?.email ?? undefined} isAdmin={isAdmin} categories={menuTree} />
        </div>
      </div>

      {/* Masaüstü — arama kendi tam-genişlik satırında (üst menüyle sıkışmasın) */}
      <div className="hidden md:block border-t border-border">
        <div className="max-w-6xl mx-auto px-8 py-2.5">
          <SearchBar />
        </div>
      </div>

      <HeaderCategoryBar categories={menuTree} />

      <div className="md:hidden border-t border-border px-4 py-2.5">
        <SearchBar />
      </div>
    </header>
    <MobileBottomNav isLoggedIn={!!user} />
    </>
  );
}
