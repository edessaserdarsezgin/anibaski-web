"use client";

import { useRouter } from "next/navigation";

/**
 * Sol üstte "Geri" butonu — geçmiş varsa router.back(), yoksa fallback'e gider.
 * Header'sız (auth) veya derin sayfalarda mobil gezinmeyi kolaylaştırır.
 */
export default function BackButton({
  fallback = "/",
  label = "Geri",
  className = "",
}: {
  fallback?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Geri"
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-text-light hover:text-primary transition-colors cursor-pointer ${className}`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
      {label}
    </button>
  );
}
