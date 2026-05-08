"use client";

import { useState } from "react";

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
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setSaving(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setStatus(next);
    setSaving(false);
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={saving}
      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
      ))}
    </select>
  );
}
