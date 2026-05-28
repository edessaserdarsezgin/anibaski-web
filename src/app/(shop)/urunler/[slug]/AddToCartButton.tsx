"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type VariantItem = { id: string; label: string; value: string; priceAddon: number };
type VariantGroup = { type: string; items: VariantItem[] };

type Props = {
  isLoggedIn: boolean;
  product: {
    id: string;
    name: string;
    basePrice: number;
    image: string;
    requiresPhotoUpload: boolean;
    photoCount: number;
  };
  variantGroups: VariantGroup[];
};

export default function AddToCartButton({ isLoggedIn, product, variantGroups }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, VariantItem>>({});
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const totalAddon = Object.values(selected).reduce((sum, v) => sum + v.priceAddon, 0);
  const unitPrice = product.basePrice + totalAddon;
  const totalPrice = unitPrice * quantity;

  function handleAddToCart() {
    const existing: Record<string, unknown>[] = JSON.parse(localStorage.getItem("cart") ?? "[]");
    const selectedKey = JSON.stringify(Object.fromEntries(Object.entries(selected).sort()));
    const idx = existing.findIndex(
      i =>
        i.productId === product.id &&
        JSON.stringify(Object.fromEntries(Object.entries(i.variantSelections as Record<string, unknown>).sort())) === selectedKey
    );
    if (idx !== -1) {
      existing[idx] = { ...existing[idx], quantity: (existing[idx].quantity as number) + quantity };
    } else {
      existing.push({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        basePrice: product.basePrice,
        variantSelections: selected,
        quantity,
        unitPrice,
      });
    }
    localStorage.setItem("cart", JSON.stringify(existing));
    window.dispatchEvent(new Event("cart-updated"));
    setShowModal(true);
  }

  function handleGoUpload() {
    if (!isLoggedIn) {
      router.push(`/giris?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    sessionStorage.setItem("pendingPhotoUpload", JSON.stringify({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      basePrice: product.basePrice,
      variantSelections: selected,
      quantity,
      unitPrice,
      photoCount: product.photoCount,
    }));
    router.push("/fotograf-yukle");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Varyantlar */}
      {variantGroups.map(({ type, items }) => (
        <div key={type}>
          <p className="text-sm font-semibold text-text mb-2 capitalize">{type}</p>
          <div className="flex flex-wrap gap-2">
            {items.map(item => {
              const isSel = selected[type]?.id === item.id;
              return (
                <button key={item.id} onClick={() => setSelected(p => ({ ...p, [type]: item }))}
                  className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                    isSel
                      ? "border-primary bg-primary text-white"
                      : "border-border text-text hover:border-primary"
                  }`}>
                  {item.label}
                  {item.priceAddon > 0 && <span className="ml-1 opacity-70">+{item.priceAddon.toLocaleString("tr-TR")}₺</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Adet */}
      <div>
        <p className="text-sm font-semibold text-text mb-2">Adet</p>
        <div className="flex items-center gap-3">
          <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-lg border border-border text-text hover:border-primary transition-colors font-semibold">−</button>
          <span className="w-8 text-center font-semibold text-text">{quantity}</span>
          <button onClick={() => setQuantity(q => q + 1)}
            className="w-9 h-9 rounded-lg border border-border text-text hover:border-primary transition-colors font-semibold">+</button>
        </div>
      </div>

      {/* Fiyat + Aksiyon */}
      <div className="pt-4 border-t border-border">
        <p className="text-2xl font-semibold text-primary mb-4">
          {totalPrice.toLocaleString("tr-TR")} ₺
        </p>

        <div className="flex gap-2">
          {product.requiresPhotoUpload ? (
            <div className="flex flex-col gap-2 flex-1">
              {!isLoggedIn && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                  Fotoğraf yüklemek için giriş yapmanız gerekiyor.
                </p>
              )}
              <button onClick={handleGoUpload}
                className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Fotoğrafları Yükle ({product.photoCount} adet)
              </button>
              <p className="text-xs text-center text-text-light">
                Sonraki adımda {product.photoCount} fotoğraf yüklemeniz gerekiyor
              </p>
            </div>
          ) : (
            <button onClick={handleAddToCart}
              className="flex-1 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors">
              Sepete Ekle
            </button>
          )}
        </div>
      </div>

      {/* Sepete eklendi modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl border border-border shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-text text-sm">Sepete Eklendi</p>
                <p className="text-xs text-text-light mt-0.5">{product.name} · {totalPrice.toLocaleString("tr-TR")} ₺</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push("/sepet")}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors text-sm"
              >
                Sepete Git
              </button>
              <button
                onClick={() => { setShowModal(false); router.back(); }}
                className="w-full py-3 border border-border hover:border-primary text-text font-semibold rounded-full transition-colors text-sm"
              >
                Alışverişe Devam Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
