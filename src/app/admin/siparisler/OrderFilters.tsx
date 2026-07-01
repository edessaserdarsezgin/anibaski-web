"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";
import CustomSelect from "@/components/ui/CustomSelect";

const STATUS_OPTIONS = [
  { value: "", label: "Tüm durumlar" },
  { value: "PENDING", label: "Beklemede" },
  { value: "PREPARING", label: "Hazırlanıyor" },
  { value: "SHIPPED", label: "Kargoda" },
  { value: "DELIVERED", label: "Teslim Edildi" },
  { value: "CANCELLED", label: "İptal" },
  { value: "CANCEL_REQUESTED", label: "İptal Talebi" },
];

export default function OrderFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(next.toString() ? `/admin/siparisler?${next}` : "/admin/siparisler");
    },
    [params, router]
  );

  const qTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setQDebounced = useCallback(
    (value: string) => {
      if (qTimer.current) clearTimeout(qTimer.current);
      qTimer.current = setTimeout(() => setParam("q", value), 400);
    },
    [setParam]
  );

  const status = params.get("status") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const q = params.get("q") ?? "";
  const hasFilter = status || from || to || q;

  const inputCls = "px-3 py-2 rounded-lg border border-border bg-white text-sm outline-none focus:border-primary transition-colors";

  return (
    <div className="bg-white rounded-2xl border border-border p-4 mb-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
      <div className="flex flex-col gap-1 min-w-[150px]">
        <label className="text-xs text-text-light font-semibold">Durum</label>
        <CustomSelect value={status} onChange={(v) => setParam("status", v)} ariaLabel="Durum filtresi" className={inputCls} options={STATUS_OPTIONS} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-light font-semibold">Başlangıç</label>
        <input type="date" value={from} onChange={(e) => setParam("from", e.target.value)} className={inputCls} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-light font-semibold">Bitiş</label>
        <input type="date" value={to} onChange={(e) => setParam("to", e.target.value)} className={inputCls} />
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
        <label className="text-xs text-text-light font-semibold">Ürün ara</label>
        <input
          type="search"
          defaultValue={q}
          placeholder="Ürün adı…"
          onChange={(e) => setQDebounced(e.target.value)}
          className={inputCls}
        />
      </div>
      {hasFilter && (
        <button
          onClick={() => router.push("/admin/siparisler")}
          className="px-4 py-2 text-sm font-semibold text-text-light hover:text-text border border-border rounded-lg transition-colors"
        >
          Temizle
        </button>
      )}
    </div>
  );
}
