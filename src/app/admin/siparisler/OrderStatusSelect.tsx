"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

const STATUSES = ["PENDING", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"];
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Beklemede", PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoda", DELIVERED: "Teslim Edildi", CANCELLED: "İptal",
};

export default function OrderStatusSelect({
  orderId, currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const isCancelRequested = currentStatus === "CANCEL_REQUESTED";
  // CANCEL_REQUESTED durumunda select PENDING üzerinde durur (iptal öncesi son durum)
  const [status, setStatus] = useState(isCancelRequested ? "PENDING" : currentStatus);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setStatus(next);
      toast(`Durum güncellendi: ${STATUS_LABEL[next]}`);
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
        {STATUSES.map((s) => (
          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
        ))}
      </select>
    </div>
  );
}
