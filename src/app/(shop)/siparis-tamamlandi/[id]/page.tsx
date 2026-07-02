import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getShippingSettings } from "@/lib/shipping";
import CartClearer from "./CartClearer";
import ShippingEstimate from "@/app/(shop)/urunler/[slug]/ShippingEstimate";

export const metadata = { title: "Siparişiniz Alındı", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

const STATUS_STEPS = [
  { label: "Siparişiniz Alındı", desc: "Ödemeniz onaylandı", done: true },
  { label: "Hazırlanıyor", desc: "Ekibimiz baskıya başlıyor", done: false },
  { label: "Kargoya Verildi", desc: "Kargo firmasına teslim edildi", done: false },
  { label: "Teslim Edildi", desc: "Kapınıza geldi", done: false },
];

export default async function SiparisTamamlandiPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/giris?redirect=/siparis-tamamlandi/${id}`);

  const [{ data: order }, shippingInfo, { data: creditGrant }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, userId, status, total, subtotal, shippingFee, createdAt, paymentMethod, items:order_items(id, quantity, unitPrice, product:products(name, images, slug))")
      .eq("id", id)
      .single(),
    getShippingSettings(),
    admin
      .from("studio_credit_grants")
      .select("amount")
      .eq("orderId", id)
      .eq("source", "order")
      .maybeSingle(),
  ]);

  if (!order || order.userId !== user.id) notFound();

  const orderNo = order.id.slice(0, 8).toUpperCase();
  const isCod = order.paymentMethod === "cod";

  return (
    <>
      <CartClearer />
      <style>{`
        @keyframes checkScale {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(3deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-check  { animation: checkScale 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both; }
        .anim-up-1   { animation: fadeUp 0.4s ease 0.3s both; }
        .anim-up-2   { animation: fadeUp 0.4s ease 0.45s both; }
        .anim-up-3   { animation: fadeUp 0.4s ease 0.6s both; }
        .anim-up-4   { animation: fadeUp 0.4s ease 0.75s both; }
        .anim-up-5   { animation: fadeUp 0.4s ease 0.9s both; }
      `}</style>

      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* ── Başarı ikonası ─────────────────────────── */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="anim-check w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="anim-up-1 font-serif text-3xl md:text-4xl text-text mb-2">Siparişiniz Alındı!</h1>
          <p className="anim-up-2 text-text-light text-lg">
            Teşekkürler. Siparişinizi hazırlamaya başlıyoruz.
          </p>
          <div className="anim-up-2 mt-3 flex items-center gap-2 text-sm">
            <span className="text-text-light">Sipariş No:</span>
            <span className="font-mono font-bold text-primary text-base tracking-wider">#{orderNo}</span>
          </div>
          {isCod && (
            <p className="anim-up-2 mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5">
              Kapıda ödeme seçtiniz — kurye geldiğinde ödeme yapabilirsiniz.
            </p>
          )}
        </div>

        {/* ── AI kredi kazanımı (yalnız grant oluştuysa) ─ */}
        {creditGrant?.amount ? (
          <Link
            href="/studyo"
            className="anim-up-3 flex items-center gap-4 bg-accent/15 border border-accent/40 rounded-2xl p-5 mb-5 hover:bg-accent/25 transition-colors"
          >
            <span className="text-3xl shrink-0">🎨</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text">Bu siparişle {creditGrant.amount} AI Stüdyo kredisi kazandın!</p>
              <p className="text-sm text-text-light mt-0.5">Fotoğraflarını yapay zekâ ile iyileştir → Stüdyoya git</p>
            </div>
            <span className="text-primary shrink-0">→</span>
          </Link>
        ) : null}

        {/* ── Sonraki adımlar ────────────────────────── */}
        <div className="anim-up-3 bg-white rounded-2xl border border-border p-6 mb-5">
          <p className="text-sm font-semibold text-text-light uppercase tracking-widest mb-5">Sonraki Adımlar</p>
          <div className="flex flex-col gap-4">
            {STATUS_STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  step.done ? "bg-green-500" : "bg-bg border-2 border-border"
                }`}>
                  {step.done ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold text-text-light">{i + 1}</span>
                  )}
                </div>
                <div className={i < STATUS_STEPS.length - 1 ? "pb-4 border-b border-border flex-1" : "flex-1"}>
                  <p className={`text-sm font-semibold ${step.done ? "text-green-600" : "text-text"}`}>{step.label}</p>
                  <p className="text-xs text-text-light mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tahmini kargo tarihi ───────────────────── */}
        <div className="anim-up-4 mb-5">
          <ShippingEstimate
            cutoffHour={shippingInfo.dispatchCutoffHour}
            dispatchBusinessDays={shippingInfo.dispatchBusinessDays}
            extraHolidays={shippingInfo.extraHolidays}
            mode="order"
          />
        </div>

        {/* ── Sipariş özeti ──────────────────────────── */}
        <div className="anim-up-4 bg-white rounded-2xl border border-border p-6 mb-5">
          <p className="text-sm font-semibold text-text-light uppercase tracking-widest mb-4">Sipariş Özeti</p>
          <div className="flex flex-col gap-3 mb-4">
            {(order.items ?? []).map((item) => {
              const product = item.product as unknown as { name: string; images: string[]; slug: string } | null;
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl bg-bg border border-border shrink-0 overflow-hidden">
                    {product?.images?.[0]
                      ? <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="48px" />
                      : <div className="w-full h-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{product?.name}</p>
                    <p className="text-xs text-text-light">{item.quantity} adet</p>
                  </div>
                  <p className="text-sm font-semibold text-primary shrink-0">
                    {(Number(item.unitPrice) * item.quantity).toLocaleString("tr-TR")} ₺
                  </p>
                </div>
              );
            })}
          </div>
          <div className="pt-4 border-t border-border flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-text-light">
              <span>Ara toplam</span>
              <span>{Number(order.subtotal).toLocaleString("tr-TR")} ₺</span>
            </div>
            <div className="flex justify-between text-text-light">
              <span>Kargo</span>
              <span>{Number(order.shippingFee) === 0 ? <span className="text-green-600">Ücretsiz</span> : `${Number(order.shippingFee).toLocaleString("tr-TR")} ₺`}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-1">
              <span>Toplam</span>
              <span className="text-primary">{Number(order.total).toLocaleString("tr-TR")} ₺</span>
            </div>
          </div>
        </div>

        {/* ── E-posta notu ───────────────────────────── */}
        <div className="anim-up-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-bg border border-border text-sm text-text-light mb-6">
          <svg className="w-4 h-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          Sipariş onay e-postası gönderildi.
        </div>

        {/* ── CTA'lar ────────────────────────────────── */}
        <div className="anim-up-5 flex flex-col sm:flex-row gap-3">
          <Link
            href={`/siparisler/${order.id}`}
            className="flex-1 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full text-center transition-colors"
          >
            Siparişimi Takip Et
          </Link>
          <Link
            href="/urunler"
            className="flex-1 py-3.5 border border-border hover:border-primary text-text font-semibold rounded-full text-center transition-colors"
          >
            Alışverişe Devam Et
          </Link>
        </div>

      </div>
    </>
  );
}
