"use client";

import { useCart } from "@/hooks/useCart";

export default function CartCount() {
  const { count } = useCart();
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
      {count > 9 ? "9+" : count}
    </span>
  );
}
