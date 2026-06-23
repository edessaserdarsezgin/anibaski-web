"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import LegalModal from "@/components/legal/LegalModal";
import CaymaHakkiDoc from "@/components/legal/CaymaHakkiDoc";
import OnBilgilendirmeDoc from "@/components/legal/OnBilgilendirmeDoc";
import MesafeliSatisDoc from "@/components/legal/MesafeliSatisDoc";
import type { LegalDocBuyer, LegalDocItem } from "@/components/legal/types";
import type { CompanyInfo } from "@/lib/company";
import { cartPromoAmount, isDateValid, type Promotion } from "@/lib/promotionsCalc";

type Address = {
  id: string; title: string; fullName: string; phone: string;
  address: string; city: string; district: string; zip: string | null;
};

const emptyForm = { title: "", fullName: "", phone: "", address: "", city: "", district: "", zip: "" };

type PaymentMethod = "credit_card" | "cod";

type AppliedCoupon = { code: string; discountAmount: number; discountType: string; discountValue: number };

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
          <div className="text-sm flex flex-col gap-0.5 min-w-0">
            <p className="font-semibold text-text truncate">{addr.title}</p>
            <p className="text-text-light truncate">{addr.fullName} · {addr.phone}</p>
            <p className="text-text-light break-words">{addr.address}</p>
            <p className="text-text-light break-words">{addr.district}, {addr.city}{addr.zip ? ` ${addr.zip}` : ""}</p>
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

export default function CheckoutClient({ initialAddresses, shippingFee: SHIPPING_FEE, freeShippingThreshold: FREE_SHIPPING_THRESHOLD, codFee: COD_FEE, userEmail, userFullName, seller, paymentFailed = false }: { initialAddresses: Address[]; shippingFee: number; freeShippingThreshold: number; codFee: number; userEmail: string; userFullName: string; seller: CompanyInfo; paymentFailed?: boolean }) {
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  // PayTR başarısız ödemede iframe'i /odeme?fail=1'e yönlendirir → ana pencereye çık (yoksa
  // küçük iframe içinde ödeme sayfası açılır). Çıktıktan sonra başarısız uyarısı gösterilir.
  const [breakingOut, setBreakingOut] = useState(false);
  useEffect(() => {
    if (paymentFailed && window.top && window.top !== window.self) {
      setBreakingOut(true);
      window.top.location.href = "/odeme?fail=1";
    }
  }, [paymentFailed]);

  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [shippingId, setShippingId] = useState<string | null>(initialAddresses[0]?.id ?? null);
  const [billingSame, setBillingSame] = useState(true);
  const [billingId, setBillingId] = useState<string | null>(initialAddresses[0]?.id ?? null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paytrToken, setPaytrToken] = useState<string | null>(null);
  const [mssAccepted, setMssAccepted] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [legalModal, setLegalModal] = useState<"cayma" | "on-bilgilendirme" | "mesafeli" | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("appliedCoupon");
    if (saved) setAppliedCoupon(JSON.parse(saved));
  }, []);

  const [cartAutos, setCartAutos] = useState<Promotion[]>([]);
  const [stacking, setStacking] = useState(false);
  useEffect(() => {
    fetch("/api/promotions").then(r => r.json()).then(d => { setCartAutos(d.cartAutos ?? []); setStacking(!!d.stacking); }).catch(() => {});
  }, []);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // PayTR iframe'den gelen yükseklik mesajlarını dinle
  useEffect(() => {
    if (!paytrToken) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== "https://www.paytr.com") return;
      const iframe = iframeRef.current;
      if (!iframe) return;

      // iFrameResizer formatı: [iFrameSizer]ID:yükseklik:...
      if (typeof e.data === "string" && e.data.startsWith("[iFrameSizer]")) {
        const parts = e.data.split(":");
        const height = parseInt(parts[1]);
        if (!isNaN(height) && height > 0) {
          iframe.style.height = height + "px";
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // paytr.js'yi yükle
    const script = document.createElement("script");
    script.src = "https://www.paytrcdn.com/paytr.js";
    script.onload = () => {
      const win = window as unknown as { iFrameResize?: (opts: object, selector: string) => void };
      win.iFrameResize?.({ checkOrigin: false }, "#paytriframe");
    };
    document.body.appendChild(script);

    return () => {
      window.removeEventListener("message", handleMessage);
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [paytrToken]);

  const shippingFee = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const codFee = paymentMethod === "cod" ? COD_FEE : 0;
  // Kupon vs sepet eşikli otomatik indirim — müşteriye büyüğü (sunucu da aynı kuralı uygular)
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const checkoutItems = items.map((it) => ({
    productId: it.productId,
    categoryId: (it as { categoryId?: string | null }).categoryId ?? null,
    unitPrice: it.unitPrice, quantity: it.quantity,
  }));
  let autoDiscount = 0;
  for (const p of cartAutos) {
    if (!isDateValid(p)) continue;
    if (p.minSubtotal && total < p.minSubtotal) continue;
    const amt = cartPromoAmount(p, checkoutItems);
    if (amt > autoDiscount) autoDiscount = amt;
  }
  const discountAmount = Math.min(total, stacking ? couponDiscount + autoDiscount : Math.max(couponDiscount, autoDiscount));
  const couponWins = !!appliedCoupon && couponDiscount >= autoDiscount;
  const grandTotal = total + shippingFee + codFee - discountAmount;

  const shippingAddress = addresses.find(a => a.id === shippingId) ?? null;
  const legalBuyer: LegalDocBuyer | null = shippingAddress ? {
    fullName: userFullName || shippingAddress.fullName,
    email: userEmail,
    phone: shippingAddress.phone,
    address: shippingAddress.address,
    district: shippingAddress.district,
    city: shippingAddress.city,
    zip: shippingAddress.zip,
  } : null;
  const legalItems: LegalDocItem[] = items.map(item => ({
    name: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    variantLabel: Object.values(item.variantSelections).map(v => v.label).join(", ") || undefined,
  }));
  const today = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const legalDocProps = legalBuyer ? {
    buyer: legalBuyer,
    items: legalItems,
    subtotal: total,
    shippingFee: shippingFee + codFee,
    discountCode: couponWins ? appliedCoupon?.code : (autoDiscount > 0 ? "Sepet indirimi" : undefined),
    discountAmount,
    total: grandTotal,
    date: today,
    seller,
  } : null;

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
    if (!mssAccepted) { setError("Devam edebilmek için Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi'ni onaylamanız gerekiyor."); return; }

    setError("");
    setLoading(true);

    try {
      // 1. Siparişi oluştur
      const orderRes = await fetch("/api/orders", {
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
          discountCode: appliedCoupon?.code ?? null,
          source: sessionStorage.getItem("source") ?? "direct",
        }),
      });

      if (!orderRes.ok) throw new Error();
      const { orderId } = await orderRes.json();

      // Kapıda ödeme → doğrudan teşekkür sayfasına
      if (paymentMethod === "cod") {
        clearCart();
        sessionStorage.removeItem("source");
        sessionStorage.removeItem("appliedCoupon");
        router.push(`/siparis-tamamlandi/${orderId}`);
        return;
      }

      // Kredi kartı → PayTR iframe token al
      const tokenRes = await fetch("/api/paytr/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!tokenRes.ok) {
        const { error: tokenErr } = await tokenRes.json();
        throw new Error(tokenErr ?? "Ödeme başlatılamadı");
      }

      const { token } = await tokenRes.json();
      // Sepet ve kupon henüz temizlenmez — PayTR callback başarı durumunda
      // siparis-tamamlandi sayfasında temizlenir; kart reddi olursa kullanıcı tekrar deneyebilir
      setPaytrToken(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  }

  // iframe'den ana pencereye çıkılırken kısa "yönlendiriliyor" ekranı (form flash'ını engeller)
  if (breakingOut) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-24 text-center text-text-light">
        Yönlendiriliyorsunuz...
      </div>
    );
  }

  if (items.length === 0 && !paytrToken) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-24 text-center">
        <h1 className="font-serif text-2xl text-text mb-4">Sepetiniz boş</h1>
        <Link href="/urunler" className="text-primary hover:underline font-semibold">Ürünlere git</Link>
      </div>
    );
  }

  // PayTR iframe görünümü
  if (paytrToken) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-8">
        <p className="text-center text-xs text-secondary mb-4 flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          PayTR güvenli ödeme altyapısı — 256-bit SSL
        </p>
        <iframe
          ref={iframeRef}
          src={`https://www.paytr.com/odeme/guvenli/${paytrToken}`}
          id="paytriframe"
          frameBorder="0"
          scrolling="no"
          style={{ width: "100%", height: 900, minHeight: 900 }}
          allow="payment"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      <h1 className="font-serif text-3xl text-text mb-8">Ödeme</h1>

      {paymentFailed && (
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3.5">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div className="text-sm">
            <p className="font-semibold text-red-700">Ödeme tamamlanamadı</p>
            <p className="text-red-600">Kartınızdan çekim yapılmadı. Bilgilerinizi kontrol edip tekrar deneyebilirsiniz.</p>
          </div>
        </div>
      )}

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
                  { value: "cod", label: "Kapıda Ödeme", desc: `+${COD_FEE.toLocaleString("tr-TR")} ₺ hizmet bedeli` },
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
                <div className="mt-4 p-4 rounded-xl bg-bg border border-border text-sm text-text-light text-center flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <span>PayTR güvenli ödeme altyapısı — 256-bit SSL şifreleme</span>
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
                  <div key={i} className="flex justify-between items-start gap-2">
                    <span className="text-text-light truncate flex-1 min-w-0">{item.productName}</span>
                    <div className="text-right ml-2 shrink-0">
                      {item.quantity > 1 && (
                        <p className="text-xs text-text-light">
                          {item.unitPrice.toLocaleString("tr-TR")} ₺ × {item.quantity}
                        </p>
                      )}
                      <span className="font-semibold">
                        {(item.unitPrice * item.quantity).toLocaleString("tr-TR")} ₺
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-light">Ara toplam</span>
                  <span className="font-semibold">{total.toLocaleString("tr-TR")} ₺</span>
                </div>
                {stacking ? (
                  <>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Kupon indirimi ({appliedCoupon!.code})</span>
                        <span className="font-semibold">−{couponDiscount.toLocaleString("tr-TR")} ₺</span>
                      </div>
                    )}
                    {autoDiscount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Sepet indirimi</span>
                        <span className="font-semibold">−{autoDiscount.toLocaleString("tr-TR")} ₺</span>
                      </div>
                    )}
                  </>
                ) : (
                  discountAmount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>{couponWins ? `Kupon indirimi (${appliedCoupon!.code})` : "Sepet indirimi"}</span>
                      <span className="font-semibold">−{discountAmount.toLocaleString("tr-TR")} ₺</span>
                    </div>
                  )
                )}
                <div className="flex justify-between">
                  <span className="text-text-light">Kargo</span>
                  <span className="font-semibold">
                    {shippingFee === 0 ? <span className="text-green-600">Ücretsiz</span> : `${shippingFee.toLocaleString("tr-TR")} ₺`}
                  </span>
                </div>
                {codFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-light">Kapıda ödeme bedeli</span>
                    <span className="font-semibold">{codFee.toLocaleString("tr-TR")} ₺</span>
                  </div>
                )}
              </div>
              <div className="border-t border-border mt-4 pt-4 flex justify-between items-center mb-5">
                <span className="font-semibold text-text">Toplam</span>
                <span className="text-xl font-semibold text-primary">
                  {grandTotal.toLocaleString("tr-TR")} ₺
                </span>
              </div>
              {/* Sözleşme ve Formlar */}
              <div className="border border-border rounded-xl overflow-hidden mb-4">
                <p className="text-xs font-semibold text-text-light px-4 py-2.5 bg-bg border-b border-border uppercase tracking-wide">
                  Sözleşme ve Formlar
                </p>
                {(["cayma", "on-bilgilendirme", "mesafeli"] as const).map(key => {
                  const labels: Record<string, string> = {
                    "cayma": "Cayma Hakkı",
                    "on-bilgilendirme": "Ön Bilgilendirme Formu",
                    "mesafeli": "Mesafeli Satış Sözleşmesi",
                  };
                  return (
                    <div key={key} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
                      <span className="text-sm text-text">{labels[key]}</span>
                      <button
                        type="button"
                        onClick={() => setLegalModal(key)}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Oku →
                      </button>
                    </div>
                  );
                })}
              </div>
              {/* Onay checkbox */}
              <label className="flex items-start gap-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={mssAccepted}
                  onChange={(e) => setMssAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
                />
                <span className="text-xs text-text-light leading-relaxed">
                  <button type="button" onClick={() => setLegalModal("on-bilgilendirme")}
                    className="text-primary underline hover:no-underline">
                    Ön Bilgilendirme Formu
                  </button>
                  {" "}ve{" "}
                  <button type="button" onClick={() => setLegalModal("mesafeli")}
                    className="text-primary underline hover:no-underline">
                    Mesafeli Satış Sözleşmesi
                  </button>
                  &apos;ni okudum, onaylıyorum.
                </span>
              </label>
              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 mb-4">{error}</p>
              )}
              <button type="submit" disabled={loading || !mssAccepted}
                className="w-full py-3.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold rounded-full transition-colors">
                {loading
                  ? (paymentMethod === "credit_card" ? "Ödeme hazırlanıyor..." : "Sipariş oluşturuluyor...")
                  : (paymentMethod === "credit_card" ? "Ödemeye Geç" : "Siparişi Onayla")}
              </button>
            </div>
          </div>
        </div>
      </form>
      {legalModal && legalDocProps && (
        <LegalModal
          title={
            legalModal === "cayma" ? "Cayma Hakkı" :
            legalModal === "on-bilgilendirme" ? "Ön Bilgilendirme Formu" :
            "Mesafeli Satış Sözleşmesi"
          }
          onClose={() => setLegalModal(null)}
        >
          {legalModal === "cayma" && <CaymaHakkiDoc {...legalDocProps} />}
          {legalModal === "on-bilgilendirme" && <OnBilgilendirmeDoc {...legalDocProps} />}
          {legalModal === "mesafeli" && <MesafeliSatisDoc {...legalDocProps} />}
        </LegalModal>
      )}
    </div>
  );
}
