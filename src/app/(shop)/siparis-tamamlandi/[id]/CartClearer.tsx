"use client";

import { useEffect } from "react";

export default function CartClearer() {
  useEffect(() => {
    localStorage.setItem("cart", "[]");
    window.dispatchEvent(new Event("cart-updated"));
    sessionStorage.removeItem("appliedCoupon");
    sessionStorage.removeItem("source");
    // Server snapshot'ı da temizle
    fetch("/api/cart/snapshot", { method: "DELETE" }).catch(() => {});
  }, []);
  return null;
}
