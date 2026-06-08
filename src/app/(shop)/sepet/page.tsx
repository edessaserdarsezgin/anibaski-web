"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/components/ui/ToastProvider";
import BackButton from "@/components/ui/BackButton";
import CardScroller from "@/components/ui/CardScroller";
import ProductCard from "@/components/product/ProductCard";

type AppliedCoupon = { code: string; discountAmount: number; discountType: string; discountValue: number };

type SuggestionProduct = {
  id: string; name: string; slug: string; basePrice: number; images: string[] | null;
  discount_percent: number | null; discount_starts_at: string | null; discount_ends_at: string | null;
};

export default function SepetPage() {
  const { items, total, updateQuantity, removeItem } = useCart();
  const { toast } = useToast();

  const [shippingFeeVal, setShippingFeeVal] = useState(49);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(500);

  useEffect(() => {
    fetch("/api/shipping-settings")
      .then(r => r.json())
      .then(d => {
        setShippingFeeVal(d.shippingFee);
        setFreeShippingThreshold(d.freeShippingThreshold);
      })
      .catch(() => {});
  }, []);

  const [suggestions, setSuggestions] = useState<SuggestionProduct[]>([]);
  useEffect(() => {
    fetch("/api/cart/suggestions")
      .then(r => r.json())
      .then(d => setSuggestions(d.products ?? []))
      .catch(() => {});
  }, []);

  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = sessionStorage.getItem("appliedCoupon");
    return saved ? JSON.parse(saved) : null;
  });

  const discountAmount = appliedCoupon
    ? appliedCoupon.discountType === "percentage"
      ? Math.round(total * (appliedCoupon.discountValue / 100) * 100) / 100
      : Math.min(appliedCoupon.discountValue, total)
    : 0;
  const shippingFee = total >= freeShippingThreshold ? 0 : shippingFeeVal;
  const grandTotal = total + shippingFee - discountAmount;

  // Ücretsiz kargo ilerlemesi
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - total);
  const shippingProgress = freeShippingThreshold > 0 ? Math.min(100, (total / freeShippingThreshold) * 100) : 100;

  // Toplam kazanç = ürün indirimleri (orijinal birim = basePrice + varyant eklentileri) + kupon
  const productSavings = items.reduce((sum, item) => {
    const addons = Object.values(item.variantSelections).reduce((s, v) => s + v.priceAddon, 0);
    const original = item.basePrice + addons;
    return sum + Math.max(0, original - item.unitPrice) * item.quantity;
  }, 0);
  const totalSavings = productSavings + discountAmount;

  // Çapraz satış — sepetteki ürünleri çıkar
  const cartProductIds = new Set(items.map((i) => i.productId));
  const filteredSuggestions = suggestions.filter((p) => !cartProductIds.has(p.id)).slice(0, 10);

  // Adet değişince sessionStorage'daki indirim tutarını güncelle
  useEffect(() => {
    if (!appliedCoupon) return;
    const updated = { ...appliedCoupon, discountAmount };
    sessionStorage.setItem("appliedCoupon", JSON.stringify(updated));
  }, [total, appliedCoupon, discountAmount]);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponInput, subtotal: total }),
    });
    const data = await res.json();
    setCouponLoading(false);
    if (!res.ok) {
      toast(data.error, "error");
      return;
    }
    setAppliedCoupon(data);
    sessionStorage.setItem("appliedCoupon", JSON.stringify(data));
    toast(`"${data.code}" kuponu uygulandı! ${data.discountAmount.toLocaleString("tr-TR")} ₺ indirim kazandınız.`);
    setCouponInput("");
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    sessionStorage.removeItem("appliedCoupon");
  }

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        <BackButton className="mb-10" />
        <div className="text-center">
        <p className="text-4xl mb-4">🛒</p>
        <h1 className="font-serif text-2xl text-text mb-2">Sepetiniz boş</h1>
        <p className="text-text-light mb-8">Ürünleri keşfetmeye başlayın.</p>
        <Link
          href="/urunler"
          className="inline-block px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors"
        >
          Ürünlere Git
        </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
      <BackButton className="mb-6" />
      <h1 className="font-serif text-3xl text-text mb-6">Sepetim</h1>

      {/* Ücretsiz kargo ilerleme çubuğu */}
      <div className="bg-white rounded-2xl border border-border p-4 mb-6">
        {remainingForFreeShipping > 0 ? (
          <p className="text-sm text-text mb-2.5">
            🚚 Ücretsiz kargo için sepetine{" "}
            <b className="text-primary">{remainingForFreeShipping.toLocaleString("tr-TR")} ₺</b> daha ürün ekle!
          </p>
        ) : (
          <p className="text-sm font-semibold text-green-700 mb-2.5">🎉 Tebrikler, ücretsiz kargo kazandın!</p>
        )}
        <div className="h-2 rounded-full bg-bg overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${remainingForFreeShipping > 0 ? "bg-primary" : "bg-green-500"}`}
            style={{ width: `${shippingProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ürünler */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-border p-5 flex gap-4"
            >
              <div className="relative w-20 h-20 rounded-xl bg-bg border border-border shrink-0 overflow-hidden">
                {item.productImage ? (
                  <Image src={item.productImage} alt={item.productName} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-text-light">Görsel yok</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-serif text-base text-text truncate">{item.productName}</h2>
                    {Object.values(item.variantSelections).length > 0 && (
                      <p className="text-xs text-text-light mt-0.5 line-clamp-1">
                        {Object.values(item.variantSelections).map((v) => v.label).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {item.quantity > 1 && (
                      <p className="text-[11px] text-text-light whitespace-nowrap">
                        {item.unitPrice.toLocaleString("tr-TR")} ₺ × {item.quantity}
                      </p>
                    )}
                    <p className="font-semibold text-primary whitespace-nowrap">
                      {(item.unitPrice * item.quantity).toLocaleString("tr-TR")} ₺
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(index, Math.max(1, item.quantity - 1))}
                      className="w-7 h-7 rounded-md border border-border text-sm font-semibold hover:border-primary transition-colors"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="w-7 h-7 rounded-md border border-border text-sm font-semibold hover:border-primary transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(index)}
                    className="text-xs font-semibold text-text-light hover:text-red-500 transition-colors"
                  >
                    Kaldır
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Özet */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-border p-6 sticky top-24">
            <h2 className="font-serif text-xl text-text mb-5">Sipariş Özeti</h2>

            {/* Kupon kodu */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
                <div>
                  <p className="text-xs font-semibold text-green-700">{appliedCoupon.code}</p>
                  <p className="text-xs text-green-600">
                    {appliedCoupon.discountType === "percentage"
                      ? `%${appliedCoupon.discountValue} indirim`
                      : `${appliedCoupon.discountValue} ₺ indirim`}
                  </p>
                </div>
                <button onClick={handleRemoveCoupon} className="text-xs text-red-500 hover:text-red-700 font-semibold">
                  Kaldır
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  placeholder="Kupon kodu"
                  className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text outline-none focus:border-primary transition-colors"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="shrink-0 px-4 py-2 text-sm font-semibold bg-text text-white rounded-lg hover:bg-text/80 disabled:opacity-50 transition-colors"
                >
                  {couponLoading ? "..." : "Uygula"}
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-light">Ara toplam</span>
                <span className="font-semibold">{total.toLocaleString("tr-TR")} ₺</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-700">
                  <span>İndirim ({appliedCoupon.code})</span>
                  <span className="font-semibold">−{discountAmount.toLocaleString("tr-TR")} ₺</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-light">Kargo</span>
                <span className="font-semibold">
                  {shippingFee === 0 ? (
                    <span className="text-green-600">Ücretsiz</span>
                  ) : (
                    `${shippingFee} ₺`
                  )}
                </span>
              </div>
              {shippingFee > 0 && (
                <p className="text-xs text-text-light">
                  {freeShippingThreshold} ₺ üzeri alışverişlerde kargo ücretsiz.
                </p>
              )}
            </div>

            <div className="border-t border-border mt-4 pt-4 flex justify-between items-center">
              <span className="font-semibold text-text">Toplam</span>
              <span className="text-xl font-semibold text-primary">
                {grandTotal.toLocaleString("tr-TR")} ₺
              </span>
            </div>

            {totalSavings > 0 && (
              <div className="mt-3 flex justify-between items-center bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                <span className="text-sm font-semibold text-green-700">Toplam Kazanç</span>
                <span className="text-sm font-bold text-green-700">{totalSavings.toLocaleString("tr-TR")} ₺</span>
              </div>
            )}

            <Link
              href="/odeme"
              className="mt-5 block text-center py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors"
            >
              Ödemeye Geç
            </Link>

            <Link
              href="/urunler"
              className="mt-3 block text-center text-sm text-text-light hover:text-primary transition-colors"
            >
              Alışverişe devam et
            </Link>
          </div>
        </div>
      </div>

      {/* Sepete Özel Ürünler — çapraz satış */}
      {filteredSuggestions.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-text mb-5">Sepete Özel Ürünler</h2>
          <CardScroller>
            {filteredSuggestions.map((p) => (
              <ProductCard key={p.id} variant="strip" product={p} />
            ))}
          </CardScroller>
        </section>
      )}
    </div>
  );
}
