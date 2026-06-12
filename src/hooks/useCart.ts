"use client";

import { useEffect, useState } from "react";

export type CartItem = {
  productId: string;
  productName: string;
  productImage: string;
  basePrice: number;
  variantSelections: Record<string, { id: string; label: string; value: string; priceAddon: number }>;
  quantity: number;
  unitPrice: number;
  uploadedImages?: string[];
};

const CART_KEY = "cart";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
  scheduleSnapshotSync(items);
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function syncCartSnapshot() {
  if (typeof window === "undefined") return;
  const items = readCart();
  scheduleSnapshotSync(items);
}

function scheduleSnapshotSync(items: CartItem[]) {
  if (typeof window === "undefined") return;
  if (syncTimer) clearTimeout(syncTimer);
  // 2 saniye debounce — sürekli klik'lerde gereksiz istek olmasın
  syncTimer = setTimeout(() => {
    const payload = items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      productImage: i.productImage,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      variantSelections: i.variantSelections,
    }));
    fetch("/api/cart/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload }),
    }).catch(() => {});
  }, 2000);
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readCart());
    const onUpdate = () => setItems(readCart());
    window.addEventListener("cart-updated", onUpdate);
    return () => window.removeEventListener("cart-updated", onUpdate);
  }, []);

  function updateQuantity(index: number, quantity: number) {
    const next = [...items];
    next[index] = { ...next[index], quantity };
    writeCart(next);
    setItems(next);
  }

  function removeItem(index: number) {
    const next = items.filter((_, i) => i !== index);
    writeCart(next);
    setItems(next);
  }

  function clearCart() {
    writeCart([]);
    setItems([]);
  }

  // Sunucudan gelen güncel birim fiyatları uygula (index hizalı). null = ürün satışta değil → düşür.
  function repriceCart(prices: (number | null)[]): { removed: number; changed: number } {
    if (prices.length !== items.length) return { removed: 0, changed: 0 };
    const next: CartItem[] = [];
    let removed = 0, changed = 0;
    items.forEach((item, i) => {
      const p = prices[i];
      if (p === null || p === undefined) { removed++; return; }
      if (p !== item.unitPrice) { changed++; next.push({ ...item, unitPrice: p }); }
      else next.push(item);
    });
    if (removed > 0 || changed > 0) { writeCart(next); setItems(next); }
    return { removed, changed };
  }

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, total, count, updateQuantity, removeItem, clearCart, repriceCart };
}
