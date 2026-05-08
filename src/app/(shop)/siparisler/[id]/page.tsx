import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

type Props = { params: Promise<{ id: string }> };

const STATUS_STEPS = ["PENDING", "PREPARING", "SHIPPED", "DELIVERED"];

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Beklemede",
  PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal Edildi",
};

export default async function SiparisDetayPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/giris?redirect=/siparisler/${id}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      address: true,
    },
  });

  if (!order || order.userId !== user.id) notFound();

  const isCancelled = order.status === "CANCELLED";
  const currentStep = isCancelled ? -1 : STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="mb-8">
        <p className="text-sm text-[var(--color-text-light)] mb-1">
          <Link href="/siparisler" className="hover:text-[var(--color-primary)]">Siparişlerim</Link>
          {" / "}
          <span>#{order.id.slice(0, 8).toUpperCase()}</span>
        </p>
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl text-[var(--color-text)]">Sipariş Detayı</h1>
          <p className="text-sm text-[var(--color-text-light)]">
            {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Durum Takibi */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 mb-6">
        <h2 className="font-serif text-lg text-[var(--color-text)] mb-6">Sipariş Durumu</h2>

        {isCancelled ? (
          <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            Bu sipariş iptal edildi.
          </p>
        ) : (
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                      done
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                        : "border-[var(--color-border)] text-[var(--color-text-light)]"
                    }`}>
                      {done && !active ? "✓" : i + 1}
                    </div>
                    <p className={`text-xs font-semibold text-center whitespace-nowrap ${active ? "text-[var(--color-primary)]" : done ? "text-[var(--color-text)]" : "text-[var(--color-text-light)]"}`}>
                      {STATUS_LABEL[step]}
                    </p>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < currentStep ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ürünler */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--color-border)] p-6">
          <h2 className="font-serif text-lg text-[var(--color-text)] mb-4">Ürünler</h2>
          <div className="flex flex-col gap-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b border-[var(--color-border)] last:border-0 last:pb-0">
                <div className="w-16 h-16 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] flex-shrink-0 flex items-center justify-center text-xs text-[var(--color-text-light)]">
                  Görsel
                </div>
                <div className="flex-1">
                  <p className="font-serif text-[var(--color-text)]">{item.product.name}</p>
                  {item.variantSelections && Object.keys(item.variantSelections as object).length > 0 && (
                    <p className="text-xs text-[var(--color-text-light)] mt-0.5">
                      {Object.values(item.variantSelections as Record<string, { label: string }>)
                        .map((v) => v.label).join(", ")}
                    </p>
                  )}
                  <p className="text-sm text-[var(--color-text-light)] mt-1">Adet: {item.quantity}</p>
                </div>
                <p className="font-semibold text-[var(--color-primary)]">
                  {(Number(item.unitPrice) * item.quantity).toLocaleString("tr-TR")} ₺
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Özet + Adres */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
            <h2 className="font-serif text-lg text-[var(--color-text)] mb-3">Özet</h2>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-light)]">Ara toplam</span>
                <span>{Number(order.subtotal).toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-light)]">Kargo</span>
                <span>{Number(order.shippingFee) === 0 ? <span className="text-green-600">Ücretsiz</span> : `${Number(order.shippingFee).toLocaleString("tr-TR")} ₺`}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-[var(--color-border)]">
                <span>Toplam</span>
                <span className="text-[var(--color-primary)]">{Number(order.total).toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
            <h2 className="font-serif text-lg text-[var(--color-text)] mb-3">Teslimat Adresi</h2>
            <div className="text-sm text-[var(--color-text-light)] flex flex-col gap-0.5">
              <p className="font-semibold text-[var(--color-text)]">{order.address.fullName}</p>
              <p>{order.address.phone}</p>
              <p>{order.address.address}</p>
              <p>{order.address.district}, {order.address.city} {order.address.zip ?? ""}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
