"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";

const SHIPPING_FEE = 49;
const FREE_SHIPPING_THRESHOLD = 500;
const COD_FEE = 30;

type Address = {
  id: string; title: string; fullName: string; phone: string;
  address: string; city: string; district: string; zip: string | null;
};

const emptyForm = { title: "", fullName: "", phone: "", address: "", city: "", district: "", zip: "" };

type PaymentMethod = "credit_card" | "cod";

function AddressPicker({
  label,
  addresses,
  selectedId,
  onSelect,
}: {
  label: string;
  addresses: Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputCls = "px-4 py-2.5 rounded-lg border border-border bg-bg text-sm outline-none focus:border-primary transition-colors";

  async function handleSave() {
    if (!form.title || !form.fullName || !form.phone || !form.city || !form.district || !form.address) {
      setError("Lütfen zorunlu alanları doldurun."); return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Kaydedilemedi."); setSaving(false); return; }
    addresses.push(data);
    onSelect(data.id);
    setShowForm(false);
    setSaving(false);
    setForm(emptyForm);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-text">{label}</p>

      {addresses.map(addr => (
        <label key={addr.id}
          className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
            selectedId === addr.id
              ? "border-primary bg-orange-50"
              : "border-border hover:border-primary"
          }`}
        >
          <input type="radio" name={label} checked={selectedId === addr.id}
            onChange={() => { onSelect(addr.id); setShowForm(false); }}
            className="mt-0.5 accent-primary" />
          <div className="text-sm flex flex-col gap-0.5">
            <p className="font-semibold text-text">{addr.title}</p>
            <p className="text-text-light">{addr.fullName} · {addr.phone}</p>
            <p className="text-text-light">{addr.address}</p>
            <p className="text-text-light">{addr.district}, {addr.city}{addr.zip ? ` ${addr.zip}` : ""}</p>
          </div>
        </label>
      ))}

      {!showForm ? (
        <button type="button" onClick={() => setShowForm(true)}
          className="self-start text-sm text-primary hover:underline font-semibold">
          + Yeni adres ekle
        </button>
      ) : (
        <div className="rounded-xl border border-primary p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-text">Yeni Adres</p>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className={inputCls} placeholder="Adres başlığı (ör: Ev, İş)" />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              className={inputCls} placeholder="Ad Soyad" />
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className={inputCls} placeholder="Telefon" type="tel" />
            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              className={inputCls} placeholder="İl" />
            <input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
              className={inputCls} placeholder="İlçe" />
          </div>
          <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            rows={2} className={inputCls + " resize-none"} placeholder="Mahalle, cadde, sokak, bina no, daire no" />
          <input value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))}
            className={inputCls} placeholder="Posta kodu (opsiyonel)" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button type="button" disabled={saving} onClick={handleSave}
              className="px-5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors">
              {saving ? "Kaydediliyor..." : "Kaydet ve Seç"}
            </button>
            {addresses.length > 0 && (
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2 border border-border text-sm font-semibold rounded-full hover:border-primary transition-colors">
                İptal
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutClient({ initialAddresses }: { initialAddresses: Address[] }) {
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [shippingId, setShippingId] = useState<string | null>(initialAddresses[0]?.id ?? null);
  const [billingSame, setBillingSame] = useState(true);
  const [billingId, setBillingId] = useState<string | null>(initialAddresses[0]?.id ?? null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shippingFee = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const codFee = paymentMethod === "cod" ? COD_FEE : 0;
  const grandTotal = total + shippingFee + codFee;

  // AddressPicker'dan yeni adres eklenince listeyi güncelle
  function handleShippingSelect(id: string) {
    setShippingId(id);
    if (billingSame) setBillingId(id);
    // Eğer yeni adres eklendiyse (addresses listesinde yoksa) listeyi yenile
    setAddresses(prev => prev.some(a => a.id === id) ? prev : prev);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shippingId) { setError("Lütfen bir teslimat adresi seçin."); return; }
    if (!billingSame && !billingId) { setError("Lütfen bir fatura adresi seçin."); return; }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddressId: shippingId,
          billingAddressId: billingSame ? shippingId : billingId,
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
        <h1 className="font-serif text-2xl text-text mb-4">Sepetiniz boş</h1>
        <a href="/urunler" className="text-primary hover:underline font-semibold">Ürünlere git</a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <h1 className="font-serif text-3xl text-text mb-8">Ödeme</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Teslimat Adresi */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-serif text-xl text-text mb-5">Teslimat Adresi</h2>
              <AddressPicker
                label="Teslimat adresi seçin"
                addresses={addresses}
                selectedId={shippingId}
                onSelect={handleShippingSelect}
              />
            </div>

            {/* Fatura Adresi */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-serif text-xl text-text mb-5">Fatura Adresi</h2>
              <label className="flex items-center gap-2.5 mb-4 cursor-pointer select-none">
                <input type="checkbox" checked={billingSame}
                  onChange={e => {
                    setBillingSame(e.target.checked);
                    if (e.target.checked) setBillingId(shippingId);
                  }}
                  className="w-4 h-4 accent-primary" />
                <span className="text-sm font-semibold text-text">
                  Fatura adresim teslimat adresimle aynı
                </span>
              </label>
              {!billingSame && (
                <AddressPicker
                  label="Fatura adresi seçin"
                  addresses={addresses}
                  selectedId={billingId}
                  onSelect={setBillingId}
                />
              )}
            </div>

            {/* Ödeme Yöntemi */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-serif text-xl text-text mb-5">Ödeme Yöntemi</h2>
              <div className="flex flex-col gap-3">
                {[
                  { value: "credit_card", label: "Kredi / Banka Kartı", desc: "Güvenli ödeme altyapısı ile" },
                  { value: "cod", label: "Kapıda Ödeme", desc: `+${COD_FEE} ₺ hizmet bedeli` },
                ].map(opt => (
                  <label key={opt.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === opt.value
                        ? "border-primary bg-orange-50"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    <input type="radio" name="paymentMethod" value={opt.value}
                      checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value as PaymentMethod)}
                      className="accent-primary" />
                    <div>
                      <p className="text-sm font-semibold text-text">{opt.label}</p>
                      <p className="text-xs text-text-light">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {paymentMethod === "credit_card" && (
                <div className="mt-4 p-4 rounded-xl bg-bg border border-border text-sm text-text-light text-center">
                  Ödeme entegrasyonu yakında eklenecek (İyzico / PayTR)
                </div>
              )}
            </div>
          </div>

          {/* Sipariş Özeti */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-border p-6 sticky top-24">
              <h2 className="font-serif text-xl text-text mb-4">Sipariş Özeti</h2>
              <div className="flex flex-col gap-2 text-sm mb-4">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-text-light truncate max-w-[180px]">
                      {item.productName} ×{item.quantity}
                    </span>
                    <span className="font-semibold ml-2 shrink-0">
                      {(item.unitPrice * item.quantity).toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-light">Ara toplam</span>
                  <span className="font-semibold">{total.toLocaleString("tr-TR")} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light">Kargo</span>
                  <span className="font-semibold">
                    {shippingFee === 0 ? <span className="text-green-600">Ücretsiz</span> : `${shippingFee} ₺`}
                  </span>
                </div>
                {codFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-light">Kapıda ödeme bedeli</span>
                    <span className="font-semibold">{codFee} ₺</span>
                  </div>
                )}
              </div>
              <div className="border-t border-border mt-4 pt-4 flex justify-between items-center mb-5">
                <span className="font-semibold text-text">Toplam</span>
                <span className="text-xl font-semibold text-primary">
                  {grandTotal.toLocaleString("tr-TR")} ₺
                </span>
              </div>
              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 mb-4">{error}</p>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold rounded-full transition-colors">
                {loading ? "Sipariş oluşturuluyor..." : "Siparişi Onayla"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
