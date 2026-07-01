import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import OrderFilters from "./OrderFilters";
import OrdersManager, { type AdminOrder } from "./OrdersManager";

export const metadata = { title: "Siparişler | Admin" };

type Props = { searchParams: Promise<{ status?: string; from?: string; to?: string; q?: string; sf?: string }> };

const VALID_STATUS = ["PENDING", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "CANCEL_REQUESTED"];

export default async function AdminSiparislerPage({ searchParams }: Props) {
  noStore();
  const { status, from, to, q, sf } = await searchParams;
  const searchField = sf || "makbuz";
  const supabase = createAdminClient();
  const { data: allOrders } = await supabase
    .from("orders")
    .select(`id, type, status, total, createdAt, "trackingCode", "adminNote", "paymentMethod", "paymentStatus", items:order_items(id, quantity, variantSelections, product:products(name)), address:addresses!orders_addressId_fkey(fullName, city), buyer:profiles!orders_userId_fkey(fullName, email)`)
    .order("createdAt", { ascending: false });

  // Tamamlanmamış kredi kartı siparişleri admin listesinde de gizlensin
  let orders = (allOrders ?? []).filter(o =>
    o.paymentMethod === "cod" || o.paymentStatus === "paid"
  );

  // Durum filtresi
  if (status && VALID_STATUS.includes(status)) {
    orders = orders.filter(o => o.status === status);
  }
  // Tarih aralığı (createdAt, gün bazlı — bitiş günü dahil)
  if (from) orders = orders.filter(o => o.createdAt >= from);
  if (to) orders = orders.filter(o => o.createdAt <= `${to}T23:59:59.999Z`);
  // Arama — türüne göre (varsayılan makbuz no)
  if (q?.trim()) {
    const needle = q.trim().toLocaleLowerCase("tr");
    if (searchField === "makbuz") {
      // Makbuz no = sipariş id ön eki (hex) — ascii karşılaştır
      const asciiNeedle = q.trim().toLowerCase().replace(/[#\s]/g, "");
      orders = orders.filter(o => o.id.toLowerCase().includes(asciiNeedle));
    } else if (searchField === "isim") {
      orders = orders.filter(o => {
        const buyer = o.buyer as unknown as { fullName: string | null; email: string } | null;
        const address = o.address as unknown as { fullName: string } | null;
        return [buyer?.fullName, buyer?.email, address?.fullName]
          .some(n => n?.toLocaleLowerCase("tr").includes(needle));
      });
    } else {
      // Ürün adı — siparişin herhangi bir kalemi eşleşirse
      orders = orders.filter(o =>
        (o.items ?? []).some(it => {
          const p = it.product as unknown as { name: string } | null;
          return p?.name?.toLocaleLowerCase("tr").includes(needle);
        })
      );
    }
  }

  // OrdersManager için serileştirilebilir sadeleştirme
  const managerOrders: AdminOrder[] = orders.map(o => ({
    id: o.id,
    type: (o as { type?: string }).type,
    status: o.status,
    total: Number(o.total),
    createdAt: o.createdAt,
    trackingCode: (o as { trackingCode: string | null }).trackingCode,
    adminNote: (o as { adminNote: string | null }).adminNote,
    items: (o.items ?? []).map(it => ({
      id: it.id,
      quantity: it.quantity,
      variantSelections: it.variantSelections as Record<string, { label: string }> | null,
      product: it.product as unknown as { name: string } | null,
    })),
    address: o.address as unknown as { fullName: string; city: string } | null,
    buyer: o.buyer as unknown as { fullName: string | null; email: string } | null,
  }));

  return (
    <div>
      <h1 className="font-serif text-3xl text-text mb-6">Siparişler</h1>
      <Suspense fallback={<div className="h-20 mb-6" />}>
        <OrderFilters />
      </Suspense>
      <OrdersManager orders={managerOrders} />
    </div>
  );
}
