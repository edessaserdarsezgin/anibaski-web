import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCreditStatus, getCreditStats } from "@/lib/studioCredits";
import CreditStatsView from "@/components/studio/CreditStatsView";
import ProfileForm from "./ProfileForm";
import AddressBook from "./AddressBook";
import PhoneVerification from "./PhoneVerification";

export const metadata = { title: "Profilim", robots: { index: false, follow: false } };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Beklemede", PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoda", DELIVERED: "Teslim Edildi", CANCELLED: "İptal Edildi",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PREPARING: "bg-blue-50 text-blue-700 border-blue-200",
  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/profil");

  const [{ data: profile }, { data: addresses }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("addresses").select("*").eq("userId", user.id).order("title", { ascending: true }),
    supabase.from("orders")
      .select("id, status, total, createdAt, items:order_items(id, quantity, product:products(name))")
      .eq("userId", user.id)
      .order("createdAt", { ascending: false })
      .limit(5),
  ]);

  const [credits, creditStats] = await Promise.all([
    getCreditStatus(user.id),
    getCreditStats(user.id),
  ]);

  const isGoogleUser = user.app_metadata?.provider === "google";

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-text">Profilim</h1>
        <p className="text-sm text-text-light mt-1">{user.email}</p>
      </div>

      <div className="flex flex-col gap-6">

        {/* Favorilerim */}
        <a
          href="/favorilerim"
          className="flex items-center justify-between bg-white rounded-2xl border border-border p-5 hover:border-primary/40 hover:shadow-soft transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#e07a5f" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-text text-sm">Favorilerim</p>
              <p className="text-xs text-text-light">Kaydettiğiniz ürünler</p>
            </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-text-light group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>

        {/* AI Stüdyo Kredilerim */}
        <section className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl text-text">AI Stüdyo Kredilerim</h2>
            <Link href="/studyo" className="text-sm text-primary hover:underline font-semibold">
              Stüdyoya git →
            </Link>
          </div>
          <p className="text-sm text-text-light mb-5">
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

        {/* Kişisel Bilgiler */}
        <section className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
            <h2 className="font-serif text-xl text-text">Kişisel Bilgiler</h2>
            <PhoneVerification
              phone={profile?.phone ?? null}
              verified={profile?.phone_verified ?? false}
            />
          </div>
          <ProfileForm
            email={user.email!}
            fullName={profile?.fullName ?? null}
            phone={profile?.phone ?? null}
            landline={profile?.landline ?? null}
            notifyDeliveryContact={profile?.notify_delivery_contact ?? false}
            marketingConsent={profile?.marketing_consent ?? false}
          />
        </section>

        {/* Adreslerim */}
        <section className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-xl text-text mb-5">Adreslerim</h2>
          <AddressBook initial={addresses ?? []} />
        </section>

        {/* Son Siparişler */}
        <section className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl text-text">Son Siparişler</h2>
            <Link href="/siparisler" className="text-sm text-primary hover:underline font-semibold">
              Tümünü gör →
            </Link>
          </div>

          {!orders?.length ? (
            <p className="text-sm text-text-light">Henüz siparişiniz yok.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {orders.map(order => (
                <Link
                  key={order.id}
                  href={`/siparisler/${order.id}`}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border hover:border-primary transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-mono text-text-light">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-text-light">
                      {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-xs text-text-light mt-0.5">
                      {(order.items as unknown as { quantity: number; product: { name: string } | null }[])
                        ?.slice(0, 2)
                        .map(i => i.product?.name)
                        .join(", ")}
                      {(order.items?.length ?? 0) > 2 && ` +${order.items!.length - 2} ürün`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLOR[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {Number(order.total).toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Hesap Ayarları */}
        <section className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-xl text-text mb-5">Hesap Ayarları</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-bg border border-border">
              <div>
                <p className="text-sm font-semibold text-text">Giriş Yöntemi</p>
                <p className="text-xs text-text-light mt-0.5">
                  {isGoogleUser ? "Google hesabı ile bağlı" : "E-posta ve şifre"}
                </p>
              </div>
              {isGoogleUser && (
                <svg width="20" height="20" viewBox="0 0 24 24" className="flex-shrink-0">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-bg border border-border">
              <div>
                <p className="text-sm font-semibold text-text">Üyelik</p>
                <p className="text-xs text-text-light mt-0.5">
                  {new Date(user.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} tarihinden beri üye
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
