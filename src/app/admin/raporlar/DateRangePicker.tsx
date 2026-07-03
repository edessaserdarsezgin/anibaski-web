"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DateRangePicker({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const cls = "px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text outline-none focus:border-primary";
  return (
    <div className="flex items-end gap-2 flex-wrap print:hidden">
      <label className="flex flex-col gap-1 text-xs text-text-light">Başlangıç
        <input type="date" value={f} max={t} onChange={(e) => setF(e.target.value)} className={cls} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-text-light">Bitiş
        <input type="date" value={t} min={f} onChange={(e) => setT(e.target.value)} className={cls} />
      </label>
      <button onClick={() => router.push(`/admin/raporlar?from=${f}&to=${t}`)}
        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-full transition-colors">
        Uygula
      </button>
    </div>
  );
}
