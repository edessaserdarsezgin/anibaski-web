import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

export const metadata = { title: "Siparişlerim | AnıBaskı" };

export default async function SiparislerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/siparisler");

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total, createdAt, items:order_items(id, quantity, variantSelections, product:products(name, images))")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false });

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
                <div>
                  <p className="text-xs text-text-light mb-1">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="text-sm font-mono text-text-light">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_COLOR[order.status]}`}>
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
                      <div className="w-10 h-10 rounded-lg bg-bg border border-border flex-shrink-0 overflow-hidden">
                        {product?.images?.[0]
                          ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full" />}
                      </div>
                      <div>
                        <p className="text-sm text-text">
                          {product?.name} <span className="text-text-light">×{item.quantity}</span>
                        </p>
                        {variantText && <p className="text-xs text-text-light">{variantText}</p>}
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
