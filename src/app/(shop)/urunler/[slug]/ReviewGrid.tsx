"use client";

import { useState } from "react";

export type ReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  verifiedPurchase: boolean;
  createdAt: string;
  profile: { fullName: string | null } | null;
};

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  return (
    <span className={`${size === "lg" ? "text-xl" : "text-sm"} leading-none`} aria-label={`${rating} yıldız`}>
      <span className="text-amber-400">{"★".repeat(rating)}</span>
      <span className="text-border">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function ReviewGrid({ reviews, avgRating }: { reviews: ReviewItem[]; avgRating: number }) {
  const [activeFilter, setActiveFilter] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);

  const counts = [1, 2, 3, 4, 5].map((s) => reviews.filter((r) => r.rating === s).length);
  const filtered = activeFilter === 0 ? reviews : reviews.filter((r) => r.rating === activeFilter);

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-text-light bg-bg border border-border rounded-xl px-5 py-6 text-center">
        Henüz yorum yok — ilk yorumu siz yapın!
      </p>
    );
  }

  return (
    <div>
      {/* Özet bar */}
      <div className="bg-bg border border-border rounded-2xl p-5 mb-5 flex flex-wrap items-center gap-5">
        <div className="text-center min-w-[64px]">
          <p className="font-serif text-4xl font-bold text-text leading-none">{avgRating.toFixed(1)}</p>
          <Stars rating={Math.round(avgRating)} size="lg" />
          <p className="text-xs text-text-light mt-1">{reviews.length} yorum</p>
        </div>
        <div className="flex-1 min-w-[160px] flex flex-col gap-1.5">
          {[5, 4, 3, 2, 1].map((s) => {
            const n = counts[s - 1];
            const pct = reviews.length ? Math.round((n / reviews.length) * 100) : 0;
            return (
              <button
                key={s}
                onClick={() => setActiveFilter(activeFilter === s ? 0 : s as 1|2|3|4|5)}
                className={`flex items-center gap-2 w-full text-left group transition-opacity ${
                  activeFilter !== 0 && activeFilter !== s ? "opacity-40" : ""
                }`}
              >
                <span className="text-xs text-text-light w-4 shrink-0">{s}★</span>
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-text-light w-5 text-right shrink-0">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtre rozeti */}
      {activeFilter !== 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-text-light">{activeFilter} yıldız ·</span>
          <button
            onClick={() => setActiveFilter(0)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Filtreyi kaldır
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-text-light text-center py-4">Bu puan için yorum bulunamadı.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((r) => {
            const name = r.profile?.fullName ?? "Anonim";
            const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
            const date = new Date(r.createdAt).toLocaleDateString("tr-TR", {
              day: "numeric", month: "long", year: "numeric",
            });
            return (
              <div key={r.id} className="bg-white border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text leading-tight">{name}</p>
                      <p className="text-xs text-text-light">{date}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Stars rating={r.rating} />
                    {r.verifiedPurchase && (
                      <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                        ✓ Satın Aldı
                      </span>
                    )}
                  </div>
                </div>
                {r.title && <p className="text-sm font-semibold text-text mb-1">{r.title}</p>}
                {r.body && <p className="text-sm text-text-light leading-relaxed">{r.body}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
