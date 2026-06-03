import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import UserEditForm from "./UserEditForm";
import CreditManager from "./CreditManager";

export const metadata = { title: "Üye Detay | Admin", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Beklemede", PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoda", DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal", CANCEL_REQUESTED: "İptal Talebi",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PREPARING: "bg-blue-50 text-blue-700 border-blue-200",
  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  CANCEL_REQUESTED: "bg-orange-50 text-orange-700 border-orange-200",
};

export default async function AdminUyeDetayPage({ params }: Props) {
  noStore();
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: profile }, { data: addresses }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select(`id, email, "fullName", phone, role, notify_delivery_contact, "createdAt"`).eq("id", id).single(),
    supabase.from("addresses").select("*").eq("userId", id),
    supabase.from("orders").select(`id, status, total, "createdAt", "paymentMethod", "paymentStatus"`).eq("userId", id).order("createdAt", { ascending: false }),
  ]);

  if (!profile) notFound();

  const completedOrders = (orders ?? []).filter(o => o.paymentMethod === "cod" || o.paymentStatus === "paid");
  const totalSpent = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div>
      <div className="mb-6 text-sm">
        <Link href="/admin/uyeler" className="text-text-light hover:text-primary">
          ← Üyeler
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="font-serif text-3xl text-text">{profile.fullName ?? "(İsimsiz)"}</h1>
        <p className="text-sm text-text-light mt-1">{profile.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-border p-5">
          <p className="text-xs text-text-light uppercase tracking-widest mb-1">Üyelik</p>
          <p className="text-lg font-semibold text-text">
            {new Date(profile.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5">
          <p className="text-xs text-text-light uppercase tracking-widest mb-1">Tamamlanmış Sipariş</p>
          <p className="text-lg font-semibold text-text">{completedOrders.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5">
          <p className="text-xs text-text-light uppercase tracking-widest mb-1">Toplam Harcama</p>
          <p className="text-lg font-semibold text-primary">{totalSpent.toLocaleString("tr-TR")} ₺</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-xl text-text mb-5">Profil Bilgileri</h2>
          <UserEditForm
            userId={profile.id}
            fullName={profile.fullName}
            phone={profile.phone}
            role={profile.role}
            notifyDeliveryContact={profile.notify_delivery_contact ?? false}
          />
        </section>

        <section className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-xl text-text mb-5">Kayıtlı Adresler</h2>
          {!addresses?.length ? (
            <p className="text-sm text-text-light">Adres kaydı yok.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {addresses.map((a) => (
                <div key={a.id} className="border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-text">{a.title}</p>
                    <span className="text-xs text-text-light">{a.city}</span>
                  </div>
                  <p className="text-sm text-text">{a.fullName}</p>
                  <p className="text-xs text-text-light mt-0.5">{a.phone}</p>
                  <p className="text-xs text-text-light mt-1">{a.address}</p>
                  <p className="text-xs text-text-light">{a.district}, {a.city} {a.zip}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <CreditManager userId={id} />

      <section className="bg-white rounded-2xl border border-border overflow-hidden">
        <h2 className="font-serif text-xl text-text px-6 pt-6 pb-4">Sipariş Geçmişi</h2>
        {!orders?.length ? (
          <p className="text-sm text-text-light px-6 pb-6">Sipariş yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-y border-border bg-bg">
              <tr className="text-text-light">
                <th className="text-left px-6 py-3 font-semibold">Sipariş No</th>
                <th className="text-left px-4 py-3 font-semibold">Tarih</th>
                <th className="text-left px-4 py-3 font-semibold">Ödeme</th>
                <th className="text-left px-4 py-3 font-semibold">Durum</th>
                <th className="text-right px-6 py-3 font-semibold">Tutar</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-text-light">#{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-4 text-text-light text-xs">
                    {new Date(o.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-4 text-text-light text-xs">
                    {o.paymentMethod === "cod" ? "Kapıda" : "Kart"}
                    {o.paymentStatus === "pending" && o.paymentMethod === "credit_card" && (
                      <span className="ml-1 text-orange-600">(Bekliyor)</span>
                    )}
                    {o.paymentStatus === "failed" && (
                      <span className="ml-1 text-red-600">(Başarısız)</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_COLOR[o.status] ?? STATUS_COLOR.PENDING}`}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-primary">
                    {Number(o.total).toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/siparisler/${o.id}`} className="text-xs text-primary hover:underline font-semibold">
                      Detay
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
