"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "newest",     label: "Yeniden Eskiye" },
  { value: "price_asc",  label: "Fiyat: Düşük → Yüksek" },
  { value: "price_desc", label: "Fiyat: Yüksek → Düşük" },
  { value: "name_asc",   label: "İsim: A → Z" },
  { value: "popular",    label: "Popülerlik" },
];

export default function SortSelect({ current = "newest" }: { current?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="shrink-0 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-border bg-white text-xs sm:text-sm text-text outline-none focus:border-primary transition-colors cursor-pointer"
    >
      {OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
