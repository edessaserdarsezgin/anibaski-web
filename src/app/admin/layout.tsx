import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/admin");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen bg-bg flex">
      <aside className="w-56 bg-white border-r border-border flex flex-col">
        <div className="px-6 h-16 flex items-center border-b border-border">
          <Link href="/" className="font-serif text-xl text-text">
            Anı<span className="text-primary">Baskı</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {[
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
            { href: "/admin/istatistik", label: "İstatistik" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-text-light hover:bg-bg hover:text-text transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-border">
          <p className="text-xs text-text-light truncate">{user.email}</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
