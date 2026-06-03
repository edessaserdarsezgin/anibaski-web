"use client";

import { useCallback, useEffect, useState } from "react";
import type { CreditStats } from "@/lib/studioCredits";
import CreditStatsView from "@/components/studio/CreditStatsView";

type Status = { dailyFreeRemaining: number; earnedAvailable: number; total: number; trial?: boolean; stats?: CreditStats };

export default function CreditManager({ userId }: { userId: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [delta, setDelta] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/admin/users/${userId}/credits`).then((r) => r.json()).then(setStatus).catch(() => {});
  }, [userId]);
  useEffect(load, [load]);

  async function apply() {
    if (!delta) return;
    setBusy(true);
    const res = await fetch(`/api/admin/users/${userId}/credits`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta, note }),
    });
    setBusy(false);
    if (res.ok) { setStatus(await res.json()); setDelta(0); setNote(""); }
  }

  return (
    <section className="bg-white rounded-2xl border border-border p-6 mb-8">
      <h2 className="font-serif text-xl text-text mb-4">AI Kredi</h2>
      {status ? (
        <p className="text-sm text-text-light mb-5">
          {status.trial ? "Deneme hakkı kalan" : "Günlük kalan"}: <b className="text-text">{status.dailyFreeRemaining}</b> ·
          Kazanılmış: <b className="text-text">{status.earnedAvailable}</b> ·
          Toplam: <b className="text-primary">{status.total}</b>
          {status.trial && <span className="ml-2 text-xs text-orange-600">(henüz baskı yok — deneme modunda)</span>}
        </p>
      ) : <p className="text-sm text-text-light mb-5">Yükleniyor...</p>}

      {status?.stats && (
        <div className="mb-6">
          <CreditStatsView stats={status.stats} />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-light">Miktar (+/−)</span>
          <input type="number" value={delta} onChange={(e) => setDelta(Number(e.target.value))}
            className="border border-border rounded-xl px-3 py-2 w-28" />
        </label>
        <label className="flex flex-col gap-1 flex-1 min-w-40">
          <span className="text-xs text-text-light">Not (opsiyonel)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            className="border border-border rounded-xl px-3 py-2" />
        </label>
        <button onClick={apply} disabled={busy || !delta}
          className="py-2 px-5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full disabled:opacity-50">
          Uygula
        </button>
      </div>
    </section>
  );
}
