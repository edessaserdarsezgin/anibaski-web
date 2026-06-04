"use client";
import { useRouter, usePathname } from "next/navigation";

const OPTS = [
  ["gun", "Bugün"],
  ["hafta", "Hafta"],
  ["ay", "Ay"],
  ["tum", "Tüm"],
] as const;

export default function DonemSecici({ active }: { active: string }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="inline-flex rounded-xl border border-border bg-white p-1">
      {OPTS.map(([val, label]) => (
        <button
          key={val}
          onClick={() => router.push(`${pathname}?donem=${val}`)}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            active === val ? "bg-primary text-white" : "text-text-light hover:text-text"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
