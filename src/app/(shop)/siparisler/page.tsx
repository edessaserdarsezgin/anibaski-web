import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

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

export const metadata = { title: "Siparişlerim", robots: { index: false, follow: false } };

export default async function SiparislerPage() {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/siparisler");

  const [{ data: allOrders }, { data: buyerProfile }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, status, total, createdAt, paymentMethod, paymentStatus, items:order_items(id, quantity, variantSelections, product:products(name, images)), address:addresses!orders_addressId_fkey(fullName)")
      .eq("userId", user.id)
      .order("createdAt", { ascending: false }),
    supabase.from("profiles").select("fullName").eq("id", user.id).single(),
  ]);
  const buyerName = buyerProfile?.fullName ?? null;

  // Kredi kartıyla oluşturulmuş ama ödeme tamamlanmamış (pending) siparişleri gizle
  const orders = (allOrders ?? []).filter(o =>
    o.paymentMethod === "cod" || o.paymentStatus === "paid"
  );

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <h1 className="font-serif text-3xl text-text mb-8">Siparişlerim</h1>

      {!orders?.length ? (
        <div className="text-center py-24">
          <p className="text-4xl mb-4">📦</p>
          <h2 className="font-serif text-xl text-text mb-2">Henüz siparişiniz yok</h2>
          <p className="text-text-light mb-8">İlk siparişinizi oluşturmak için ürünlere göz atın.</p>
          <Link href="/urunler" className="inline-block px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors">
            Ürünlere Git
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/siparisler/${order.id}`}
              className="bg-white rounded-2xl border border-border p-6 hover:shadow-hover hover:border-primary transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <p className="text-xs text-text-light mb-1">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="text-sm font-mono text-text-light">#{order.id.slice(0, 8).toUpperCase()}</p>
                  {(() => {
                    const recipient = (order.address as unknown as { fullName: string } | null)?.fullName;
                    const sameRecipient = buyerName && recipient &&
                      buyerName.trim().toLowerCase() === recipient.trim().toLowerCase();
                    if (recipient && !sameRecipient) {
                      return <p className="text-xs text-text-light mt-1">Teslim alan: <span className="text-text">{recipient}</span></p>;
                    }
                    return null;
                  })()}
                </div>
                <span className={`shrink-0 whitespace-nowrap text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_COLOR[order.status]}`}>
                  {STATUS_LABEL[order.status]}
                </span>
              </div>

              <div className="flex flex-col gap-2 mb-4">
                {order.items?.map((item) => {
                  const product = item.product as unknown as { name: string; images: string[] } | null;
                  const variants = item.variantSelections as Record<string, { label: string }> | null;
                  const variantText = variants && Object.keys(variants).length > 0
                    ? Object.values(variants).map(v => v.label).join(", ")
                    : null;
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg bg-bg border border-border flex-shrink-0 overflow-hidden">
                        {product?.images?.[0]
                          ? <Image src={product.images[0]} alt="" fill className="object-cover" sizes="40px" />
                          : <div className="w-full h-full" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-text truncate">
                          {product?.name} <span className="text-text-light">×{item.quantity}</span>
                        </p>
                        {variantText && <p className="text-xs text-text-light truncate">{variantText}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border">
                <span className="text-sm text-text-light">{order.items?.length} ürün</span>
                <span className="font-semibold text-primary">
                  {Number(order.total).toLocaleString("tr-TR")} ₺
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
