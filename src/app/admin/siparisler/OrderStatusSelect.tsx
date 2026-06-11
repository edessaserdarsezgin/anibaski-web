"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

const STATUSES = ["PENDING", "PREPARING", "DELIVERED", "CANCELLED"];
const STATUSES_AFTER_SHIPPED = ["SHIPPED", "DELIVERED", "CANCELLED"];
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Beklemede", PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoda", DELIVERED: "Teslim Edildi", CANCELLED: "İptal",
};
// SHIPPED durumu yalnızca kargo kodu kaydedilince otomatik set edilir;
// dropdown'dan seçilmez — bildirim yalnızca kargo kodu kaydında gider.

export default function OrderStatusSelect({
  orderId, currentStatus, currentCode,
}: {
  orderId: string;
  currentStatus: string;
  currentCode?: string | null;
}) {
  const isCancelRequested = currentStatus === "CANCEL_REQUESTED";
  const isShipped = currentStatus === "SHIPPED";
  // CANCEL_REQUESTED → PENDING göster; SHIPPED → kargo kodu ile set edilir, dropdown pasif
  const [status, setStatus] = useState(isCancelRequested ? "PENDING" : currentStatus);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    // Kargo kodu girilmeden teslim işaretlenebilir, ama önce uyar (elden teslim/özel durum esnekliği)
    if (next === "DELIVERED" && !currentCode?.trim()) {
      if (!confirm("Bu siparişe kargo kodu girilmemiş. Yine de 'Teslim Edildi' olarak işaretlensin mi?")) {
        e.target.value = status; // seçimi geri al
        return;
      }
    }
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setStatus(next);
      toast(`Durum güncellendi: ${STATUS_LABEL[next]}`);
      router.refresh();
    } else {
      toast("Durum güncellenemedi.", "error");
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {isCancelRequested && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded border text-orange-700 bg-orange-50 border-orange-200 self-start whitespace-nowrap">
          ⚠ İptal Talebi
        </span>
      )}
      <select
        value={status}
        onChange={handleChange}
        disabled={saving}
        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border bg-white text-text outline-none focus:border-primary transition-colors disabled:opacity-50"
      >
        {(isShipped ? STATUSES_AFTER_SHIPPED : STATUSES).map((s) => (
          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
        ))}
      </select>
    </div>
  );
}
