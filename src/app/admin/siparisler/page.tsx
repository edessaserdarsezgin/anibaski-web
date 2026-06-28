import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import OrderStatusSelect from "./OrderStatusSelect";
import OrderTrackingInput from "./OrderTrackingInput";

export const metadata = { title: "Siparişler | Admin" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Beklemede", PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoda", DELIVERED: "Teslim Edildi", CANCELLED: "İptal",
};

type Props = { searchParams: Promise<{ status?: string }> };

const VALID_STATUS = ["PENDING", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "CANCEL_REQUESTED"];

export default async function AdminSiparislerPage({ searchParams }: Props) {
  noStore();
  const { status } = await searchParams;
  const supabase = createAdminClient();
  const { data: allOrders } = await supabase
    .from("orders")
    .select(`id, type, status, total, createdAt, "trackingCode", "paymentMethod", "paymentStatus", items:order_items(id, quantity, variantSelections, product:products(name)), address:addresses!orders_addressId_fkey(fullName, city), buyer:profiles!orders_userId_fkey(fullName, email)`)
    .order("createdAt", { ascending: false });

  // Tamamlanmamış kredi kartı siparişleri admin listesinde de gizlensin
  const completed = (allOrders ?? []).filter(o =>
    o.paymentMethod === "cod" || o.paymentStatus === "paid"
  );

  // Dashboard aksiyon linklerinden gelen ?status= filtresi
  const activeStatus = status && VALID_STATUS.includes(status) ? status : null;
  const orders = activeStatus ? completed.filter(o => o.status === activeStatus) : completed;

  return (
    <div>
      <h1 className="font-serif text-3xl text-text mb-2">Siparişler</h1>
      {activeStatus && (
        <p className="text-sm text-text-light mb-6">
          Filtre: <span className="font-semibold text-text">{STATUS_LABEL[activeStatus] ?? activeStatus}</span>
          {" · "}
          <Link href="/admin/siparisler" className="text-primary hover:underline">Tümünü göster</Link>
        </p>
      )}
      {!activeStatus && <div className="mb-6" />}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {!orders?.length ? (
          <p className="text-sm text-text-light p-6">Henüz sipariş yok.</p>
        ) : (
          <div className="overflow-x-auto">
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
                    {(order as unknown as { type?: string }).type === "reprint" && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent/40 text-text">
                        Yeniden Baskı
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-text-light">
                    {(() => {
                      const address = order.address as unknown as { fullName: string; city: string } | null;
                      const buyer = order.buyer as unknown as { fullName: string | null; email: string } | null;
                      const buyerName = buyer?.fullName || buyer?.email || "—";
                      const recipientName = address?.fullName ?? "—";
                      const sameRecipient = buyer?.fullName && address?.fullName &&
                        buyer.fullName.trim().toLowerCase() === address.fullName.trim().toLowerCase();
                      return (
                        <>
                          <p className="text-text font-semibold text-xs">{buyerName}</p>
                          {!sameRecipient && (
                            <p className="text-xs mt-0.5">
                              <span className="text-text-light">Teslim alan:</span> {recipientName}
                            </p>
                          )}
                          <p className="text-xs mt-0.5">{address?.city}</p>
                        </>
                      );
                    })()}
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
                    <OrderStatusSelect orderId={order.id} currentStatus={order.status} currentCode={(order as unknown as { trackingCode: string | null }).trackingCode} />
                  </td>
                  <td className="px-4 py-4">
                    <OrderTrackingInput orderId={order.id} currentCode={(order as unknown as { trackingCode: string | null }).trackingCode} />
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-primary">
                    {Number(order.total).toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/siparisler/${order.id}?from=admin`} className="text-xs text-primary hover:underline font-semibold">
                      Detay
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
