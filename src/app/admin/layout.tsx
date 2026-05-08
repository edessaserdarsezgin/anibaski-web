import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/admin");

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile || profile.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-[var(--color-border)] flex flex-col">
        <div className="px-6 h-16 flex items-center border-b border-[var(--color-border)]">
          <Link href="/" className="font-serif text-xl text-[var(--color-text)]">
            Anı<span className="text-[var(--color-primary)]">Baskı</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {[
            { href: "/admin", label: "Genel Bakış" },
            { href: "/admin/siparisler", label: "Siparişler" },
            { href: "/admin/urunler", label: "Ürünler" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-[var(--color-text-light)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-light)] truncate">{user.email}</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
