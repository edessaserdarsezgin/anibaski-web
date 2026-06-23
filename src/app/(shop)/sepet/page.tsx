"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/components/ui/ToastProvider";
import BackButton from "@/components/ui/BackButton";
import CardScroller from "@/components/ui/CardScroller";
import ProductCard from "@/components/product/ProductCard";
import EmptyState from "@/components/ui/EmptyState";
import { cartPromoAmount, nextThreshold, isDateValid, type Promotion } from "@/lib/promotionsCalc";

type AppliedCoupon = { code: string; discountAmount: number };

type SuggestionProduct = {
  id: string; name: string; slug: string; basePrice: number; images: string[] | null;
  discount_percent: number | null; discount_starts_at: string | null; discount_ends_at: string | null;
};

export default function SepetPage() {
  const { items, total, updateQuantity, removeItem, repriceCart } = useCart();
  const { toast } = useToast();

  const [photoUrls, setPhotoUrls] = useState<Record<number, string[]>>({});

  useEffect(() => {
    const allPaths = items.flatMap((item, idx) =>
      (item.uploadedImages ?? []).map((p) => ({ idx, path: p }))
    );
    if (allPaths.length === 0) return;
    fetch("/api/cart/photo-thumbs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths: allPaths.map((x) => x.path) }),
    })
      .then((r) => r.json())
      .then(({ urls }: { urls: string[] }) => {
        const map: Record<number, string[]> = {};
        allPaths.forEach(({ idx }, i) => {
          if (!map[idx]) map[idx] = [];
          if (urls[i]) map[idx].push(urls[i]);
        });
        setPhotoUrls(map);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

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

  const [cartAutos, setCartAutos] = useState<Promotion[]>([]);
  const [stacking, setStacking] = useState(false);
  useEffect(() => {
    fetch("/api/promotions")
      .then(r => r.json())
      .then(d => { setCartAutos(d.cartAutos ?? []); setStacking(!!d.stacking); })
      .catch(() => {});
  }, []);

  // Kapsam-kısmi hesap için kalemler (kategori bilgisi varsa)
  const pricedItems = items.map((it) => ({
    productId: it.productId,
    categoryId: (it as { categoryId?: string | null }).categoryId ?? null,
    unitPrice: it.unitPrice,
    quantity: it.quantity,
  }));

  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = sessionStorage.getItem("appliedCoupon");
    return saved ? JSON.parse(saved) : null;
  });

  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  // Sepet eşikli otomatik indirim — kuponla çakışmaz, müşteriye büyüğü uygulanır
  let autoDiscount = 0;
  for (const p of cartAutos) {
    if (!isDateValid(p)) continue;
    if (p.minSubtotal && total < p.minSubtotal) continue;
    const amt = cartPromoAmount(p, pricedItems);
    if (amt > autoDiscount) autoDiscount = amt;
  }
  const couponWins = !!appliedCoupon && couponDiscount >= autoDiscount;
  const discountAmount = Math.min(total, stacking ? couponDiscount + autoDiscount : Math.max(couponDiscount, autoDiscount));
  const upcomingTier = nextThreshold(total, cartAutos, pricedItems);
  // Ücretsiz kargo eşiği indirim DÜŞÜLDÜKTEN sonraki tutara göre (sunucu /api/orders ile aynı)
  const discountedTotal = Math.max(0, total - discountAmount);
  const shippingFee = discountedTotal >= freeShippingThreshold ? 0 : shippingFeeVal;
  const grandTotal = total + shippingFee - discountAmount;

  // Ücretsiz kargo ilerlemesi
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - discountedTotal);
  const shippingProgress = freeShippingThreshold > 0 ? Math.min(100, (discountedTotal / freeShippingThreshold) * 100) : 100;

  // Ücretsiz kargo kazancı: kargo bedavaysa normalde ödenecek kargo bedeli kadar tasarruf
  const shippingSavings = shippingFee === 0 ? shippingFeeVal : 0;

  // Toplam kazanç = ürün indirimleri (orijinal birim = basePrice + varyant eklentileri) + kupon + kargo
  const productSavings = items.reduce((sum, item) => {
    const addons = Object.values(item.variantSelections).reduce((s, v) => s + v.priceAddon, 0);
    const original = item.basePrice + addons;
    return sum + Math.max(0, original - item.unitPrice) * item.quantity;
  }, 0);
  const totalSavings = productSavings + discountAmount + shippingSavings;
  const originalSubtotal = total + productSavings; // ürün (sale) indirimi öncesi ara toplam

  // Çapraz satış — sepetteki ürünleri çıkar
  const cartProductIds = new Set(items.map((i) => i.productId));
  const filteredSuggestions = suggestions.filter((p) => !cartProductIds.has(p.id)).slice(0, 10);

  // Kuponu sunucuda yeniden doğrula: admin sildi/süre doldu → düşür; adet/fiyat değişti → tutarı tazele.
  // Kaydedilen tutara körü körüne güvenme (stale kupon bug'ı).
  const itemsSig = JSON.stringify(items.map((i) => [i.productId, i.quantity, i.unitPrice]));

  // Sepetteki birim fiyatları sunucu doğrusuyla tazele (ürün fiyatı/indirimi sonradan değişmiş olabilir)
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/cart/reprice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, variantSelections: i.variantSelections })) }),
      });
      if (!res.ok || cancelled) return;
      const data = await res.json();
      const { removed, changed } = repriceCart(data.prices ?? []);
      if (cancelled) return;
      if (removed > 0) toast(`${removed} ürün artık satışta değil, sepetten kaldırıldı.`, "error");
      else if (changed > 0) toast("Sepetteki bazı fiyatlar güncellendi.");
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsSig]);

  useEffect(() => {
    const code = appliedCoupon?.code;
    if (!code || items.length === 0) return;
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, items: pricedItems }),
      });
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setAppliedCoupon(null);
        sessionStorage.removeItem("appliedCoupon");
        toast("Uyguladığın kupon artık geçerli değil, sepetten kaldırıldı.", "error");
        return;
      }
      const fresh = { code: data.code, discountAmount: data.discountAmount };
      setAppliedCoupon(fresh);
      sessionStorage.setItem("appliedCoupon", JSON.stringify(fresh));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsSig, appliedCoupon?.code]);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponInput, items: pricedItems }),
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
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <BackButton className="mb-6" />
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
            </svg>
          }
          title="Sepetin şimdilik boş"
          subtitle="Anılarını ürüne dönüştürmeye başla — keşfet, sepete ekle, kolayca tamamla."
          ctaHref="/urunler"
          ctaLabel="Alışverişe Başla"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
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
                    {(() => {
                      const addons = Object.values(item.variantSelections).reduce((s, v) => s + v.priceAddon, 0);
                      const originalUnit = item.basePrice + addons;
                      const discounted = originalUnit > item.unitPrice;
                      return (
                        <p className="text-[11px] text-text-light whitespace-nowrap">
                          {discounted && (
                            <span className="line-through mr-1">{originalUnit.toLocaleString("tr-TR")} ₺</span>
                          )}
                          {item.unitPrice.toLocaleString("tr-TR")} ₺ × {item.quantity}
                        </p>
                      );
                    })()}
                    <p className="font-semibold text-primary whitespace-nowrap">
                      {(item.unitPrice * item.quantity).toLocaleString("tr-TR")} ₺
                    </p>
                  </div>
                </div>

                {/* Yüklenen fotoğraf thumbnail'ları */}
                {(photoUrls[index]?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    {photoUrls[index].slice(0, 5).map((url, i) => (
                      <div key={i} className="relative w-9 h-9 rounded-md overflow-hidden border border-border bg-bg shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {photoUrls[index].length > 5 && (
                      <span className="text-[11px] text-text-light font-semibold">
                        +{photoUrls[index].length - 5} fotoğraf
                      </span>
                    )}
                    <span className="text-[11px] text-text-light ml-1">
                      {photoUrls[index].length} fotoğraf yüklendi
                    </span>
                  </div>
                )}

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
                  <p className="text-xs text-green-600">−{appliedCoupon.discountAmount.toLocaleString("tr-TR")} ₺ kupon indirimi</p>
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

            {upcomingTier && (
              <p className="text-xs font-semibold text-primary bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 mb-4">
                🎁 {(upcomingTier.minSubtotal! - total).toLocaleString("tr-TR")} ₺ daha ekle →{" "}
                {upcomingTier.valueType === "percentage" ? `%${upcomingTier.value}` : `${Number(upcomingTier.value).toLocaleString("tr-TR")} ₺`} sepet indirimi kazan!
              </p>
            )}

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-light">Ara toplam{productSavings > 0 ? " (indirimsiz)" : ""}</span>
                <span className="font-semibold">{(productSavings > 0 ? originalSubtotal : total).toLocaleString("tr-TR")} ₺</span>
              </div>
              {productSavings > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Ürün indirimi</span>
                  <span className="font-semibold">−{productSavings.toLocaleString("tr-TR")} ₺</span>
                </div>
              )}
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
                <span className="font-semibold flex items-center gap-2">
                  {shippingFee === 0 ? (
                    <>
                      {shippingSavings > 0 && (
                        <span className="line-through text-text-light font-normal">{shippingSavings.toLocaleString("tr-TR")} ₺</span>
                      )}
                      <span className="text-green-600">Ücretsiz</span>
                    </>
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
