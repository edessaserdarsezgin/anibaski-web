import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Admin | AnıBaskı" };

export default async function AdminPage() {
  const [orderCount, productCount, pendingCount, revenue] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELLED" } } }),
  ]);

  const stats = [
    { label: "Toplam Sipariş", value: orderCount },
    { label: "Bekleyen Sipariş", value: pendingCount },
    { label: "Toplam Ürün", value: productCount },
    { label: "Toplam Ciro", value: `${Number(revenue._sum.total ?? 0).toLocaleString("tr-TR")} ₺` },
  ];

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

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

  return (
    <div>
      <h1 className="font-serif text-3xl text-[var(--color-text)] mb-8">Genel Bakış</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
            <p className="text-sm text-[var(--color-text-light)] mb-1">{s.label}</p>
            <p className="font-serif text-2xl text-[var(--color-text)]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
        <h2 className="font-serif text-xl text-[var(--color-text)] mb-4">Son Siparişler</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-[var(--color-text-light)]">Henüz sipariş yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-light)]">
                <th className="text-left pb-3 font-semibold">Sipariş No</th>
                <th className="text-left pb-3 font-semibold">Tarih</th>
                <th className="text-left pb-3 font-semibold">Durum</th>
                <th className="text-right pb-3 font-semibold">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="py-3 font-mono text-[var(--color-text-light)]">#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="py-3 text-[var(--color-text-light)]">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLOR[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="py-3 text-right font-semibold text-[var(--color-primary)]">
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
