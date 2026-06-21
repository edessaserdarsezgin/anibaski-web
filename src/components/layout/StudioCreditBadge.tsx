"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

// Header'da AI Stüdyo kredi rozeti — giriş yapmış kullanıcıda her sayfada görünür.
// Kredi varsa sayıyı, dolunca "kredi kazan" çağrısını gösterir; /studyo'ya götürür.
// Araç kullanılınca "studio-credits-updated" event'i ile anında tazelenir.
export default function StudioCreditBadge() {
  const [total, setTotal] = useState<number | null>(null);

  const refresh = useCallback(() => {
    fetch("/api/ai/studio/credits")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && typeof d.total === "number" && setTotal(d.total))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("studio-credits-updated", refresh);
    return () => window.removeEventListener("studio-credits-updated", refresh);
  }, [refresh]);

  if (total === null) return (
    <div className="hidden md:inline-flex w-[88px] h-7 rounded-full" aria-hidden />
  );

  return (
    <Link
      href="/studyo"
      title="AI Stüdyo kredin"
      className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border border-border text-text hover:border-primary hover:text-primary transition-colors"
    >
      {total > 0 ? <>✨ <span className="text-primary">{total}</span> kredi</> : <>🎁 Kredi kazan</>}
    </Link>
  );
}
