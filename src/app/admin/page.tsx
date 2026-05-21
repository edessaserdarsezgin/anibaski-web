import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin | AnıBaskı" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Beklemede", PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoda", DELIVERED: "Teslim Edildi", CANCELLED: "İptal",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-yellow-700 bg-yellow-50 border-yellow-200",
  PREPARING: "text-blue-700 bg-blue-50 border-blue-200",
  SHIPPED: "text-purple-700 bg-purple-50 border-purple-200",
  DELIVERED: "text-green-700 bg-green-50 border-green-200",
  CANCELLED: "text-red-700 bg-red-50 border-red-200",
};

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { count: orderCount },
    { count: productCount },
    { count: pendingCount },
    { data: revenueData },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("orders").select("total").neq("status", "CANCELLED"),
    supabase.from("orders").select("id, status, total, createdAt, items:order_items(id)").order("createdAt", { ascending: false }).limit(5),
  ]);

  const revenue = revenueData?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

  const stats = [
    { label: "Toplam Sipariş", value: orderCount ?? 0 },
    { label: "Bekleyen Sipariş", value: pendingCount ?? 0 },
    { label: "Toplam Ürün", value: productCount ?? 0 },
    { label: "Toplam Ciro", value: `${revenue.toLocaleString("tr-TR")} ₺` },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-text mb-8">Genel Bakış</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-border p-5">
            <p className="text-sm text-text-light mb-1">{s.label}</p>
            <p className="font-serif text-2xl text-text">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-serif text-xl text-text mb-4">Son Siparişler</h2>
        {!recentOrders?.length ? (
          <p className="text-sm text-text-light">Henüz sipariş yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-light">
                <th className="text-left pb-3 font-semibold">Sipariş No</th>
                <th className="text-left pb-3 font-semibold">Tarih</th>
                <th className="text-left pb-3 font-semibold">Durum</th>
                <th className="text-right pb-3 font-semibold">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="py-3 font-mono text-text-light">#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="py-3 text-text-light">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLOR[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="py-3 text-right font-semibold text-primary">
                    {Number(order.total).toLocaleString("tr-TR")} ₺
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
