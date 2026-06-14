"use client";

import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), sec: s % 60, done: ms === 0 };
}

export default function CountdownTimer({ endsAt }: { endsAt: string }) {
  const target = new Date(endsAt).getTime();
  const [t, setT] = useState(() => diff(target));
  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (t.done) return <span className="text-sm text-text-light">Süre doldu</span>;
  const cell = (n: number, label: string) => (
    <span className="flex flex-col items-center">
      <span className="font-mono text-sm font-semibold text-white bg-primary rounded-md px-2 py-1 min-w-[2.2rem] text-center tabular-nums">
        {String(n).padStart(2, "0")}
      </span>
      <span className="text-[9px] text-text-light mt-1 uppercase tracking-wider">{label}</span>
    </span>
  );
  return (
    <div className="flex items-center gap-1.5" aria-label="Kalan süre">
      {t.d > 0 && cell(t.d, "gün")}
      {cell(t.h, "saat")}
      {cell(t.m, "dk")}
      {cell(t.sec, "sn")}
    </div>
  );
}
