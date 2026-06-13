"use client";

import { useEffect } from "react";

/**
 * PayTR iframe'inden ana pencereye çıkıp hedefe yönlendirir.
 * iframe içindeysek window.top'ı (aynı origin) hedefe sürer → top-level
 * navigasyon olduğundan oturum cookie'si gider; değilsek normal yönlendirme.
 */
export default function OdemeSonucBreakout({ target }: { target: string }) {
  useEffect(() => {
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = target;
        return;
      }
    } catch {
      // top'a erişilemezse (beklenmedik) normal yönlendirmeye düş
    }
    window.location.href = target;
  }, [target]);

  return (
    <div className="max-w-7xl mx-auto px-8 py-24 text-center text-text-light">
      Ödemeniz işleniyor, yönlendiriliyorsunuz…
    </div>
  );
}
