"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import CustomSelect from "@/components/ui/CustomSelect";

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

  function handleChange(value: string) {
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
    <CustomSelect
      value={current}
      onChange={handleChange}
      options={OPTIONS}
      ariaLabel="Sıralama"
      className="shrink-0 rounded-lg border border-border bg-white text-text px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
    />
  );
}
