"use client";

import { useEffect } from "react";

/**
 * Sticky header'ın gerçek yüksekliğini ölçüp `--header-h` CSS değişkenine yazar.
 * Header çok satırlı (logo + arama + kategori barı) ve responsive değiştiği için
 * sticky alt-çubuklar (ProductFilterBar) sabit `top` yerine `var(--header-h)` kullanır →
 * header'ın ARKASINA değil, tam ALTINA yapışır.
 */
export default function HeaderOffsetVar() {
  useEffect(() => {
    const header = document.getElementById("site-header");
    if (!header) return;
    const set = () => document.documentElement.style.setProperty("--header-h", `${header.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(header);
    window.addEventListener("resize", set);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", set);
    };
  }, []);
  return null;
}
