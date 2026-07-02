"use client";

import type { ReactNode } from "react";

export type Milestone = {
  threshold: number;                          // ₺ eşiği
  colorClass: string;                         // dolgu rengi: "bg-primary" / "bg-accent"
  icon: string;                               // emoji: "🚚" / "🎨"
  pending: (remaining: string) => ReactNode;  // "400 ₺ daha al, ..."
  done: string;                               // kısa etiket: "ücretsiz kargo"
};

const fmt = (n: number) => n.toLocaleString("tr-TR");

export default function RewardProgress({
  current,
  milestones,
}: {
  current: number;
  milestones: Milestone[];
}) {
  const list = milestones
    .filter((m) => m.threshold > 0)
    .sort((a, b) => a.threshold - b.threshold);
  if (list.length === 0) return null;

  const max = list[list.length - 1].threshold;
  const fillPct = Math.min(100, (current / max) * 100);
  const nextIdx = list.findIndex((m) => current < m.threshold);
  const allDone = nextIdx === -1;
  const fillColor = allDone ? "bg-green-500" : list[nextIdx].colorClass;

  return (
    <div className="bg-white rounded-2xl border border-border p-4 mb-6">
      {allDone ? (
        <p className="text-sm font-semibold text-green-700 mb-2.5">
          🎉 Tebrikler, {list.map((m) => m.done).join(" + ")} kazandın!
        </p>
      ) : (
        <p className="text-sm text-text mb-2.5">
          {list[nextIdx].icon} {list[nextIdx].pending(fmt(list[nextIdx].threshold - current))}
        </p>
      )}
      <div className="relative h-2 rounded-full bg-bg overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${fillColor}`}
          style={{ width: `${fillPct}%` }}
        />
      </div>
      {list.length > 1 && (
        <div className="relative h-4 mt-1">
          {list.map((m, i) => {
            const reached = current >= m.threshold;
            return (
              <span
                key={i}
                className={`absolute -translate-x-1/2 text-[11px] leading-4 ${
                  reached ? "text-green-600" : "text-text-light"
                }`}
                style={{ left: `${Math.min(100, (m.threshold / max) * 100)}%` }}
              >
                {reached ? "✓" : m.icon}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
