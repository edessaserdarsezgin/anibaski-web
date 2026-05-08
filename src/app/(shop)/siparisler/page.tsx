import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Beklemede",
  PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal Edildi",
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

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <h1 className="font-serif text-3xl text-[var(--color-text)] mb-8">Siparişlerim</h1>

      {orders.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-4xl mb-4">📦</p>
          <h2 className="font-serif text-xl text-[var(--color-text)] mb-2">Henüz siparişiniz yok</h2>
          <p className="text-[var(--color-text-light)] mb-8">İlk siparişinizi oluşturmak için ürünlere göz atın.</p>
          <Link href="/urunler" className="inline-block px-8 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold rounded-full transition-colors">
            Ürünlere Git
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/siparisler/${order.id}`}
              className="bg-white rounded-2xl border border-[var(--color-border)] p-6 hover:shadow-[var(--shadow-hover)] hover:border-[var(--color-primary)] transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs text-[var(--color-text-light)] mb-1">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="text-sm font-mono text-[var(--color-text-light)]">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_COLOR[order.status]}`}>
                  {STATUS_LABEL[order.status]}
                </span>
              </div>

              <div className="flex flex-col gap-1 mb-4">
                {order.items.map((item) => (
                  <p key={item.id} className="text-sm text-[var(--color-text)]">
                    {item.product.name} <span className="text-[var(--color-text-light)]">×{item.quantity}</span>
                  </p>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border)]">
                <span className="text-sm text-[var(--color-text-light)]">{order.items.length} ürün</span>
                <span className="font-semibold text-[var(--color-primary)]">
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
