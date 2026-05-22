"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  function reject() {
    localStorage.setItem("cookie-consent", "rejected");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-text rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-xl">
        <p className="text-sm text-white/80 flex-1 leading-relaxed">
          Siteyi daha iyi bir deneyim sunmak için çerezler kullanıyoruz.{" "}
          <Link href="/kvkk" className="text-white underline underline-offset-2 hover:text-white/70 transition-colors">
            Gizlilik Politikası
          </Link>
          'nı okuyabilirsiniz.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 text-sm font-semibold text-white/60 hover:text-white border border-white/20 hover:border-white/40 rounded-full transition-colors"
          >
            Reddet
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-full transition-colors"
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}
