import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import RoleSelect from "./RoleSelect";
import UserDelete from "./UserDelete";

export const metadata = { title: "Üyeler | Admin" };

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "bg-primary/10 text-primary border-primary/20",
  CUSTOMER: "bg-bg text-text-light border-border",
};

type Profile = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
};

type OrderRow = { userId: string; total: number; discountCode: string | null; discountAmount: number | string | null };

export default async function AdminUyelerPage() {
  noStore();
  const supabase = createAdminClient();

  const [{ data: profiles }, { data: orders }, { data: jobs }] = await Promise.all([
    supabase.from("profiles").select(`id, email, "fullName", phone, role, "createdAt"`).order("createdAt", { ascending: false }),
    supabase.from("orders").select(`"userId", total, discountCode:discount_code, discountAmount:discount_amount, "paymentMethod", "paymentStatus"`),
    supabase.from("studio_jobs").select(`"userId", status`),
  ]);

  // Tamamlanmış (paid veya cod) siparişlerin kullanıcıya göre özetini çıkar
  const completed = (orders ?? []).filter((o) => o.paymentMethod === "cod" || o.paymentStatus === "paid");
  const stats = completed.reduce<Record<string, { count: number; total: number; coupon: number; saved: number }>>((acc, o: OrderRow) => {
    const k = o.userId;
    if (!acc[k]) acc[k] = { count: 0, total: 0, coupon: 0, saved: 0 };
    acc[k].count += 1;
    acc[k].total += Number(o.total);
    if (o.discountCode) { acc[k].coupon += 1; acc[k].saved += Number(o.discountAmount ?? 0); }
    return acc;
  }, {});

  const aiStats = (jobs ?? []).reduce<Record<string, number>>((acc, j: { userId: string; status: string }) => {
    if (j.status === "success") acc[j.userId] = (acc[j.userId] ?? 0) + 1;
    return acc;
  }, {});

  const users: Profile[] = (profiles ?? []) as Profile[];

  return (
    <div>
      <h1 className="font-serif text-3xl text-text mb-2">Üyeler</h1>
      <p className="text-sm text-text-light mb-8">Toplam {users.length} üye</p>

      {/* Mobil kart düzeni */}
      <div className="md:hidden flex flex-col gap-3">
        {!users.length ? (
          <p className="text-sm text-text-light bg-white rounded-2xl border border-border p-6">Henüz üye yok.</p>
        ) : users.map((u) => {
          const stat = stats[u.id];
          return (
            <div key={u.id} className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3">
              {/* Ad + Email + Tarih */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-text truncate">{u.fullName || "—"}</p>
                  <p className="text-xs text-text-light truncate">{u.email}</p>
                  <p className="text-xs text-text-light mt-0.5">
                    {new Date(u.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <RoleSelect userId={u.id} currentRole={u.role} colorMap={ROLE_COLOR} />
              </div>

              {/* İstatistikler */}
              <div className="grid grid-cols-4 gap-2 border-t border-border pt-3 text-center">
                <div>
                  <p className="text-[10px] text-text-light mb-0.5">Sipariş</p>
                  <p className="font-semibold text-sm text-text">{stat?.count ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-light mb-0.5">Harcama</p>
                  <p className="font-semibold text-sm text-primary">
                    {stat ? `${stat.total.toLocaleString("tr-TR")} ₺` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-light mb-0.5">Kupon</p>
                  <p className="font-semibold text-sm text-text">{stat?.coupon ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-light mb-0.5">AI</p>
                  <p className="font-semibold text-sm text-text">{aiStats[u.id] ?? 0}</p>
                </div>
              </div>

              {/* Aksiyonlar */}
              <div className="flex items-center justify-between border-t border-border pt-2">
                <p className="text-xs text-text-light">{u.phone || "Telefon yok"}</p>
                <div className="flex items-center gap-3">
                  <Link href={`/admin/uyeler/${u.id}`} className="text-xs text-primary font-semibold">
                    Detay →
                  </Link>
                  <UserDelete userId={u.id} userName={u.fullName || u.email} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Masaüstü tablo */}
      <div className="hidden md:block bg-white rounded-2xl border border-border overflow-hidden">
        {!users.length ? (
          <p className="text-sm text-text-light p-6">Henüz üye yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-bg">
                <tr className="text-text-light">
                  <th className="text-left px-6 py-3 font-semibold">Üye</th>
                  <th className="text-left px-4 py-3 font-semibold">Telefon</th>
                  <th className="text-left px-4 py-3 font-semibold">Üyelik</th>
                  <th className="text-center px-4 py-3 font-semibold">Sipariş</th>
                  <th className="text-right px-4 py-3 font-semibold">Toplam Harcama</th>
                  <th className="text-center px-4 py-3 font-semibold">Kupon</th>
                  <th className="text-center px-4 py-3 font-semibold">AI</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const stat = stats[u.id];
                  return (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-text font-semibold">{u.fullName || "—"}</p>
                        <p className="text-xs text-text-light">{u.email}</p>
                      </td>
                      <td className="px-4 py-4 text-text-light">{u.phone || "—"}</td>
                      <td className="px-4 py-4 text-text-light text-xs">
                        {new Date(u.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-4 text-center">{stat?.count ?? 0}</td>
                      <td className="px-4 py-4 text-right font-semibold text-primary">
                        {stat ? `${stat.total.toLocaleString("tr-TR")} ₺` : "—"}
                      </td>
                      <td className="px-4 py-4 text-center text-text-light">{stat?.coupon ?? 0}</td>
                      <td className="px-4 py-4 text-center text-text-light">{aiStats[u.id] ?? 0}</td>
                      <td className="px-4 py-4">
                        <RoleSelect userId={u.id} currentRole={u.role} colorMap={ROLE_COLOR} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 justify-end">
                          <Link href={`/admin/uyeler/${u.id}`} className="text-xs text-primary hover:underline font-semibold">
                            Detay
                          </Link>
                          <UserDelete userId={u.id} userName={u.fullName || u.email} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
