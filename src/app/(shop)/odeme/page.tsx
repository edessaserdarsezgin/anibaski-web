"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { createClient } from "@/lib/supabase/client";

const SHIPPING_FEE = 49;
const FREE_SHIPPING_THRESHOLD = 500;
const COD_FEE = 30;

type FormData = {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  zip: string;
};

type PaymentMethod = "credit_card" | "cod";

export default function OdemePage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [form, setForm] = useState<FormData>({
    fullName: "", phone: "", city: "", district: "", address: "", zip: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shippingFee = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const codFee = paymentMethod === "cod" ? COD_FEE : 0;
  const grandTotal = total + shippingFee + codFee;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/giris?redirect=/odeme");
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: form,
          paymentMethod,
          items,
          subtotal: total,
          shippingFee: shippingFee + codFee,
          total: grandTotal,
        }),
      });

      if (!res.ok) throw new Error();

      const { orderId } = await res.json();
      clearCart();
      router.push(`/siparisler/${orderId}`);
    } catch {
      setError("Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-24 text-center">
        <h1 className="font-serif text-2xl text-[var(--color-text)] mb-4">Sepetiniz boş</h1>
        <a href="/urunler" className="text-[var(--color-primary)] hover:underline font-semibold">
          Ürünlere git
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <h1 className="font-serif text-3xl text-[var(--color-text)] mb-8">Ödeme</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol: Teslimat + Ödeme */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Teslimat Bilgileri */}
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
              <h2 className="font-serif text-xl text-[var(--color-text)] mb-5">Teslimat Bilgileri</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Ad Soyad</label>
                  <input name="fullName" required value={form.fullName} onChange={handleChange}
                    className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors"
                    placeholder="Adınız Soyadınız" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Telefon</label>
                  <input name="phone" required value={form.phone} onChange={handleChange} type="tel"
                    className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors"
                    placeholder="05xx xxx xx xx" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Posta Kodu</label>
                  <input name="zip" value={form.zip} onChange={handleChange}
                    className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors"
                    placeholder="34000" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-text)]">İl</label>
                  <input name="city" required value={form.city} onChange={handleChange}
                    className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors"
                    placeholder="İstanbul" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-text)]">İlçe</label>
                  <input name="district" required value={form.district} onChange={handleChange}
                    className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors"
                    placeholder="Kadıköy" />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-[var(--color-text)]">Adres</label>
                  <textarea name="address" required value={form.address} onChange={handleChange} rows={3}
                    className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
                    placeholder="Mahalle, cadde, sokak, bina no, daire no..." />
                </div>
              </div>
            </div>

            {/* Ödeme Yöntemi */}
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
              <h2 className="font-serif text-xl text-[var(--color-text)] mb-5">Ödeme Yöntemi</h2>
              <div className="flex flex-col gap-3">
                {[
                  { value: "credit_card", label: "Kredi / Banka Kartı", desc: "Güvenli ödeme altyapısı ile" },
                  { value: "cod", label: "Kapıda Ödeme", desc: `+${COD_FEE} ₺ hizmet bedeli` },
                ] .map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === opt.value
                        ? "border-[var(--color-primary)] bg-orange-50"
                        : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={opt.value}
                      checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value as PaymentMethod)}
                      className="accent-[var(--color-primary)]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{opt.label}</p>
                      <p className="text-xs text-[var(--color-text-light)]">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {paymentMethod === "credit_card" && (
                <div className="mt-4 p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text-light)] text-center">
                  Ödeme entegrasyonu yakında eklenecek (İyzico / PayTR)
                </div>
              )}
            </div>
          </div>

          {/* Sağ: Sipariş Özeti */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 sticky top-24">
              <h2 className="font-serif text-xl text-[var(--color-text)] mb-4">Sipariş Özeti</h2>

              <div className="flex flex-col gap-2 text-sm mb-4">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-[var(--color-text-light)] truncate max-w-[180px]">
                      {item.productName} ×{item.quantity}
                    </span>
                    <span className="font-semibold ml-2 flex-shrink-0">
                      {(item.unitPrice * item.quantity).toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--color-border)] pt-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-light)]">Ara toplam</span>
                  <span className="font-semibold">{total.toLocaleString("tr-TR")} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-light)]">Kargo</span>
                  <span className="font-semibold">
                    {shippingFee === 0 ? <span className="text-green-600">Ücretsiz</span> : `${shippingFee} ₺`}
                  </span>
                </div>
                {codFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-light)]">Kapıda ödeme bedeli</span>
                    <span className="font-semibold">{codFee} ₺</span>
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--color-border)] mt-4 pt-4 flex justify-between items-center mb-5">
                <span className="font-semibold text-[var(--color-text)]">Toplam</span>
                <span className="text-xl font-semibold text-[var(--color-primary)]">
                  {grandTotal.toLocaleString("tr-TR")} ₺
                </span>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 mb-4">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60 text-white font-semibold rounded-full transition-colors"
              >
                {loading ? "Sipariş oluşturuluyor..." : "Siparişi Onayla"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
