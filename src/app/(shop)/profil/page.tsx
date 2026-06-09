import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCreditStatus, getCreditStats } from "@/lib/studioCredits";
import CreditStatsView from "@/components/studio/CreditStatsView";
import LogoutButton from "./LogoutButton";

export const metadata = { title: "Hesabım", robots: { index: false, follow: false } };

const ICON: Record<string, React.ReactNode> = {
  orders: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />,
  user: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />,
  address: <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />,
  heart: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />,
  studio: <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 0 0 2.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />,
  campaign: <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />,
};

const MENU = [
  { href: "/siparisler", label: "Siparişlerim", icon: "orders" },
  { href: "/profil/bilgiler", label: "Bilgilerim", icon: "user" },
  { href: "/profil/adresler", label: "Adreslerim", icon: "address" },
  { href: "/favorilerim", label: "Favorilerim", icon: "heart" },
  { href: "/studyo", label: "AI Stüdyo", icon: "studio" },
  { href: "/kampanyalar", label: "Kampanyalar", icon: "campaign" },
];

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/profil");

  const [credits, creditStats] = await Promise.all([
    getCreditStatus(user.id),
    getCreditStats(user.id),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-text">Hesabım</h1>
        <p className="text-sm text-text-light mt-1 truncate">{user.email}</p>
      </div>

      <div className="flex flex-col gap-5">

        {/* Menü listesi — Sosyopix tarzı, en üstte */}
        <nav className="bg-white rounded-2xl border border-border overflow-hidden">
          {MENU.map((item, idx) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-bg transition-colors ${idx < MENU.length - 1 ? "border-b border-border" : ""}`}
            >
              <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                  {ICON[item.icon]}
                </svg>
              </span>
              <span className="flex-1 text-sm font-semibold text-text">{item.label}</span>
              <svg className="w-4 h-4 text-text-light" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </nav>

        {/* AI Stüdyo Kredilerim — farklılaştırıcı, menünün altında */}
        <section className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg text-text">AI Stüdyo Kredilerim</h2>
            <Link href="/studyo" className="text-sm text-primary hover:underline font-semibold">
              Stüdyoya git →
            </Link>
          </div>
          <p className="text-sm text-text-light mb-4">
            {credits.total > 0 ? (
              credits.trial ? (
                <>Ücretsiz deneme hakkın: <b className="text-primary">{credits.dailyFreeRemaining}</b>. Beğenirsen baskıya geç — ilk siparişinden sonra her gün ücretsiz kredi kazanırsın 🎁</>
              ) : (
                <>Şu an <b className="text-primary">{credits.total}</b> kullanım hakkın var
                  {" "}(bugün <b className="text-text">{credits.dailyFreeRemaining}</b> ücretsiz
                  {credits.earnedAvailable > 0 && <> + <b className="text-text">{credits.earnedAvailable}</b> kazanılmış</>}).</>
              )
            ) : (
              credits.trial ? (
                <>Deneme hakkın doldu — bir baskı siparişi ver, her gün ücretsiz kredi kazanmaya başla 🎁</>
              ) : (
                <>Hakkın doldu — her 1000 ₺&apos;lik baskı siparişinde yeni kredi kazanırsın 🎁</>
              )
            )}
          </p>
          <CreditStatsView stats={creditStats} />
        </section>

        {/* Çıkış — ayrı kart */}
        <div className="bg-white rounded-2xl border border-border p-2">
          <LogoutButton />
        </div>

      </div>
    </div>
  );
}
