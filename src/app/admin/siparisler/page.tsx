import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import OrderStatusSelect from "./OrderStatusSelect";

export const metadata = { title: "Siparişler | Admin" };

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

export default async function AdminSiparislerPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } }, address: true },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-[var(--color-text)] mb-8">Siparişler</h1>

      <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
        {orders.length === 0 ? (
          <p className="text-sm text-[var(--color-text-light)] p-6">Henüz sipariş yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
              <tr className="text-[var(--color-text-light)]">
                <th className="text-left px-6 py-3 font-semibold">Sipariş</th>
                <th className="text-left px-4 py-3 font-semibold">Müşteri</th>
                <th className="text-left px-4 py-3 font-semibold">Ürünler</th>
                <th className="text-left px-4 py-3 font-semibold">Durum</th>
                <th className="text-right px-6 py-3 font-semibold">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)] transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-[var(--color-text-light)] text-xs">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-[var(--color-text-light)] mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-[var(--color-text-light)]">
                    {order.address.fullName}
                    <p className="text-xs">{order.address.city}</p>
                  </td>
                  <td className="px-4 py-4">
                    {order.items.map((item) => (
                      <p key={item.id} className="text-[var(--color-text-light)]">
                        {item.product.name} ×{item.quantity}
                      </p>
                    ))}
                  </td>
                  <td className="px-4 py-4">
                    <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-[var(--color-primary)]">
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
