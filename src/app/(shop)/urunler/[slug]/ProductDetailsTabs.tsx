"use client";

import { useState } from "react";

type Specs = {
  paper_quality?: string;
  print_technique?: string;
  surface_finish?: string;
  delivery_days?: string;
  dimensions_note?: string;
} | null;

const SPEC_LABELS: Record<string, string> = {
  paper_quality: "Kağıt Kalitesi",
  print_technique: "Baskı Tekniği",
  surface_finish: "Yüzey",
  delivery_days: "Üretim Süresi",
  dimensions_note: "Boyut Notu",
};

export default function ProductDetailsTabs({ specs }: { specs: Specs }) {
  const [tab, setTab] = useState<"details" | "reviews">("details");

  const rows = specs
    ? (Object.entries(specs) as [string, unknown][])
        .filter(([, v]) => String(v ?? "").trim())
        .map(([k, v]) => [k, String(v)] as [string, string])
    : [];

  if (rows.length === 0) return null;

  return (
    <div className="mt-12 border-t border-border pt-8">
      {/* Tab bar */}
      <div role="tablist" className="flex gap-1 border-b border-border mb-6">
        {(["details", "reviews"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-text-light hover:text-text"
            }`}
          >
            {t === "details" ? "Ürün Detayları" : "Müşteri Yorumları"}
          </button>
        ))}
      </div>

      {/* Tab içeriği */}
      {tab === "details" && (
        <dl role="tabpanel" className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
          {rows.map(([key, value]) => (
            <div key={key} className="flex justify-between py-2 border-b border-border/50">
              <dt className="text-sm text-text-light">{SPEC_LABELS[key] ?? key}</dt>
              <dd className="text-sm font-semibold text-text text-right">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {tab === "reviews" && (
        <div role="tabpanel">
          <p className="text-sm text-text-light py-8 text-center">
            Müşteri yorumları yakında eklenecek.
          </p>
        </div>
      )}
    </div>
  );
}
