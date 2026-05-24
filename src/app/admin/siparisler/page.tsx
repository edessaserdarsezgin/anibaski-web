import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import OrderStatusSelect from "./OrderStatusSelect";
import OrderTrackingInput from "./OrderTrackingInput";

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
  CANCEL_REQUESTED: "text-orange-700 bg-orange-50 border-orange-200",
};

export default async function AdminSiparislerPage() {
  const supabase = createAdminClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(`id, status, total, createdAt, "trackingCode", items:order_items(id, quantity, variantSelections, product:products(name)), address:addresses!orders_addressId_fkey(fullName, city)`)
    .order("createdAt", { ascending: false });

  return (
    <div>
      <h1 className="font-serif text-3xl text-text mb-8">Siparişler</h1>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {!orders?.length ? (
          <p className="text-sm text-text-light p-6">Henüz sipariş yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-bg">
              <tr className="text-text-light">
                <th className="text-left px-6 py-3 font-semibold">Sipariş</th>
                <th className="text-left px-4 py-3 font-semibold">Müşteri</th>
                <th className="text-left px-4 py-3 font-semibold">Ürünler</th>
                <th className="text-left px-4 py-3 font-semibold">Durum</th>
                <th className="text-left px-4 py-3 font-semibold">Kargo Kodu</th>
                <th className="text-right px-6 py-3 font-semibold">Toplam</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-text-light text-xs">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-text-light mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-text-light">
                    {(order.address as unknown as { fullName: string; city: string } | null)?.fullName}
                    <p className="text-xs">{(order.address as unknown as { fullName: string; city: string } | null)?.city}</p>
                  </td>
                  <td className="px-4 py-4">
                    {order.items?.map((item) => {
                      const product = item.product as unknown as { name: string } | null;
                      const variants = item.variantSelections as Record<string, { label: string }> | null;
                      const variantText = variants && Object.keys(variants).length > 0
                        ? Object.values(variants).map(v => v.label).join(", ")
                        : null;
                      return (
                        <div key={item.id} className="mb-1 last:mb-0">
                          <p className="text-text">{product?.name} ×{item.quantity}</p>
                          {variantText && <p className="text-xs text-text-light">{variantText}</p>}
                        </div>
                      );
                    })}
                  </td>
                  <td className="px-4 py-4">
                    <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                  </td>
                  <td className="px-4 py-4">
                    <OrderTrackingInput orderId={order.id} currentCode={(order as unknown as { trackingCode: string | null }).trackingCode} />
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-primary">
                    {Number(order.total).toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/siparisler/${order.id}`} className="text-xs text-primary hover:underline font-semibold">
                      Detay
                    </Link>
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
