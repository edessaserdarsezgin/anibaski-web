"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";

const SHIPPING_FEE = 49;
const FREE_SHIPPING_THRESHOLD = 500;

export default function SepetPage() {
  const { items, total, updateQuantity, removeItem } = useCart();

  const shippingFee = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const grandTotal = total + shippingFee;

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-24 text-center">
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
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <h1 className="font-serif text-3xl text-text mb-8">Sepetim</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ürünler */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-border p-5 flex gap-4"
            >
              <div className="w-20 h-20 rounded-xl bg-bg border border-border shrink-0 overflow-hidden">
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-text-light">Görsel yok</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-base text-text truncate">{item.productName}</h2>

                {Object.values(item.variantSelections).length > 0 && (
                  <p className="text-xs text-text-light mt-0.5">
                    {Object.values(item.variantSelections).map((v) => v.label).join(", ")}
                  </p>
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

                  <div className="flex items-center gap-4">
                    <p className="font-semibold text-primary">
                      {(item.unitPrice * item.quantity).toLocaleString("tr-TR")} ₺
                    </p>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-xs text-text-light hover:text-red-500 transition-colors"
                    >
                      Kaldır
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Özet */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-border p-6 sticky top-24">
            <h2 className="font-serif text-xl text-text mb-5">Sipariş Özeti</h2>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-light">Ara toplam</span>
                <span className="font-semibold">{total.toLocaleString("tr-TR")} ₺</span>
              </div>
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
                  {FREE_SHIPPING_THRESHOLD} ₺ üzeri alışverişlerde kargo ücretsiz.
                </p>
              )}
            </div>

            <div className="border-t border-border mt-4 pt-4 flex justify-between items-center">
              <span className="font-semibold text-text">Toplam</span>
              <span className="text-xl font-semibold text-primary">
                {grandTotal.toLocaleString("tr-TR")} ₺
              </span>
            </div>

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
    </div>
  );
}
