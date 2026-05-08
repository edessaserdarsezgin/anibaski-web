"use client";

import { useState } from "react";

type VariantItem = { id: string; label: string; value: string; priceAddon: number };
type VariantGroup = { type: string; items: VariantItem[] };

type Props = {
  product: { id: string; name: string; basePrice: number };
  variantGroups: VariantGroup[];
};

export default function AddToCartButton({ product, variantGroups }: Props) {
  const [selected, setSelected] = useState<Record<string, VariantItem>>({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const totalAddon = Object.values(selected).reduce((sum, v) => sum + v.priceAddon, 0);
  const totalPrice = (product.basePrice + totalAddon) * quantity;

  function handleSelect(type: string, item: VariantItem) {
    setSelected((prev) => ({ ...prev, [type]: item }));
  }

  function handleAddToCart() {
    const cartItem = {
      productId: product.id,
      productName: product.name,
      basePrice: product.basePrice,
      variantSelections: selected,
      quantity,
      unitPrice: product.basePrice + totalAddon,
    };

    const existing = JSON.parse(localStorage.getItem("cart") ?? "[]");
    localStorage.setItem("cart", JSON.stringify([...existing, cartItem]));

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      {variantGroups.map(({ type, items }) => (
        <div key={type}>
          <p className="text-sm font-semibold text-[var(--color-text)] mb-2 capitalize">{type}</p>
          <div className="flex flex-wrap gap-2">
            {items.map((item) => {
              const isSelected = selected[type]?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(type, item)}
                  className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                      : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)]"
                  }`}
                >
                  {item.label}
                  {item.priceAddon > 0 && (
                    <span className="ml-1 opacity-70">+{item.priceAddon.toLocaleString("tr-TR")}₺</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Adet */}
      <div>
        <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Adet</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors font-semibold"
          >
            −
          </button>
          <span className="w-8 text-center font-semibold text-[var(--color-text)]">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="w-9 h-9 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors font-semibold"
          >
            +
          </button>
        </div>
      </div>

      {/* Fiyat + Sepet */}
      <div className="pt-4 border-t border-[var(--color-border)]">
        <p className="text-2xl font-semibold text-[var(--color-primary)] mb-4">
          {totalPrice.toLocaleString("tr-TR")} ₺
        </p>
        <button
          onClick={handleAddToCart}
          className="w-full py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold rounded-full transition-colors"
        >
          {added ? "✓ Sepete Eklendi" : "Sepete Ekle"}
        </button>
      </div>
    </div>
  );
}
