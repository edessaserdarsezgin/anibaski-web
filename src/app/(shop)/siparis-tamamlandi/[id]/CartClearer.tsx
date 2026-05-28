"use client";

import { useEffect } from "react";

export default function CartClearer() {
  useEffect(() => {
    localStorage.setItem("cart", "[]");
    window.dispatchEvent(new Event("cart-updated"));
    sessionStorage.removeItem("appliedCoupon");
    sessionStorage.removeItem("source");
  }, []);
  return null;
}
