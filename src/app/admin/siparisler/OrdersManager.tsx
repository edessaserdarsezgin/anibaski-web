"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import CustomSelect from "@/components/ui/CustomSelect";
import OrderStatusSelect from "./OrderStatusSelect";
import OrderTrackingInput from "./OrderTrackingInput";
import OrderNoteInput from "./OrderNoteInput";

export type AdminOrder = {
  id: string;
  type?: string;
  status: string;
  total: number;
  createdAt: string;
  trackingCode: string | null;
  adminNote: string | null;
  items: { id: string; quantity: number; variantSelections: Record<string, { label: string }> | null; product: { name: string } | null }[];
  address: { fullName: string; city: string } | null;
  buyer: { fullName: string | null; email: string } | null;
};

const BULK_STATUS = [
  { value: "PREPARING", label: "Hazırlanıyor" },
  { value: "DELIVERED", label: "Teslim Edildi" },
  { value: "CANCELLED", label: "İptal" },
  { value: "PENDING", label: "Beklemede" },
];
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Beklemede", PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoda", DELIVERED: "Teslim Edildi", CANCELLED: "İptal",
};

function buyerInfo(order: AdminOrder) {
  const buyerName = order.buyer?.fullName || order.buyer?.email || "—";
  const recipientName = order.address?.fullName ?? "—";
  const sameRecipient = !!order.buyer?.fullName && !!order.address?.fullName &&
    order.buyer.fullName.trim().toLowerCase() === order.address.fullName.trim().toLowerCase();
  return { buyerName, recipientName, sameRecipient };
}

function variantText(item: AdminOrder["items"][number]) {
  const v = item.variantSelections;
  return v && Object.keys(v).length > 0 ? Object.values(v).map((x) => x.label).join(", ") : null;
}

export default function OrdersManager({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("PREPARING");
  const [applying, setApplying] = useState(false);

  const allSelected = orders.length > 0 && selected.size === orders.length;

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.id)));
  }

  async function applyBulk() {
    if (!selected.size) return;
    const ids = [...selected];
    if (bulkStatus === "CANCELLED" && !confirm(`${ids.length} sipariş İPTAL olarak işaretlensin mi?`)) return;
    setApplying(true);
    const res = await fetch("/api/admin/orders/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status: bulkStatus }),
    });
    if (res.ok) {
      const { updated, failed } = await res.json();
      toast(`${updated} sipariş güncellendi${failed?.length ? `, ${failed.length} başarısız` : ""}: ${STATUS_LABEL[bulkStatus]}`);
      setSelected(new Set());
      router.refresh();
    } else {
      toast("Toplu güncelleme başarısız.", "error");
    }
    setApplying(false);
  }

  if (!orders.length) {
    return <p className="text-sm text-text-light bg-white rounded-2xl border border-border p-6">Sipariş bulunamadı.</p>;
  }

  return (
    <div>
      {/* Toplu aksiyon çubuğu */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-20 mb-4 bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-sm font-semibold text-text">{selected.size} sipariş seçili</span>
          <div className="flex items-center gap-2 sm:ml-auto">
            <CustomSelect
              value={bulkStatus}
              onChange={setBulkStatus}
              ariaLabel="Toplu durum"
              className="rounded-lg border border-border bg-white text-text text-sm font-semibold px-2.5 py-1.5"
              options={BULK_STATUS}
            />
            <button onClick={applyBulk} disabled={applying} className="px-4 py-1.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors">
              {applying ? "Uygulanıyor…" : "Uygula"}
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-text-light hover:text-text font-semibold">Temizle</button>
          </div>
        </div>
      )}

      {/* Mobil kart düzeni */}
      <div className="md:hidden flex flex-col gap-3">
        {orders.map((order) => {
          const { buyerName, recipientName, sameRecipient } = buyerInfo(order);
          const isReprint = order.type === "reprint";
          const isChecked = selected.has(order.id);
          return (
            <div key={order.id} className={`bg-white rounded-2xl border p-4 flex flex-col gap-3 ${isChecked ? "border-primary" : "border-border"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked={isChecked} onChange={() => toggle(order.id)} className="mt-0.5 w-4 h-4 accent-primary" aria-label="Siparişi seç" />
                  <div>
                    <p className="font-mono text-xs text-text-light">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-text-light mt-0.5">{new Date(order.createdAt).toLocaleDateString("tr-TR")}</p>
                    {isReprint && <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent/40 text-text">Yeniden Baskı</span>}
                  </div>
                </div>
                <p className="font-semibold text-primary">{Number(order.total).toLocaleString("tr-TR")} ₺</p>
              </div>

              <div className="text-sm">
                <p className="font-semibold text-text">{buyerName}</p>
                {!sameRecipient && <p className="text-xs text-text-light mt-0.5">Teslim alan: {recipientName}</p>}
                {order.address?.city && <p className="text-xs text-text-light">{order.address.city}</p>}
              </div>

              <div className="border-t border-border pt-2">
                {order.items.slice(0, 2).map((item) => (
                  <div key={item.id} className="text-xs mb-1 last:mb-0">
                    <span className="text-text">{item.product?.name} ×{item.quantity}</span>
                    {variantText(item) && <span className="text-text-light"> — {variantText(item)}</span>}
                  </div>
                ))}
                {order.items.length > 2 && <p className="text-xs text-text-light mt-1">+{order.items.length - 2} ürün daha</p>}
              </div>

              <div className="border-t border-border pt-2 flex flex-col gap-2">
                <OrderStatusSelect orderId={order.id} currentStatus={order.status} currentCode={order.trackingCode} />
                <OrderTrackingInput orderId={order.id} currentCode={order.trackingCode} />
              </div>

              <div className="border-t border-border pt-2">
                <OrderNoteInput orderId={order.id} currentNote={order.adminNote} />
              </div>

              <Link href={`/siparisler/${order.id}?from=admin`} className="text-xs text-primary font-semibold">Detayı Görüntüle →</Link>
            </div>
          );
        })}
      </div>

      {/* Masaüstü tablo */}
      <div className="hidden md:block bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-bg">
              <tr className="text-text-light">
                <th className="px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 accent-primary" aria-label="Tümünü seç" />
                </th>
                <th className="text-left px-4 py-3 font-semibold">Sipariş</th>
                <th className="text-left px-4 py-3 font-semibold">Müşteri</th>
                <th className="text-left px-4 py-3 font-semibold">Ürünler</th>
                <th className="text-left px-4 py-3 font-semibold">Durum</th>
                <th className="text-left px-4 py-3 font-semibold">Kargo Kodu</th>
                <th className="text-right px-6 py-3 font-semibold">Toplam</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const { buyerName, recipientName, sameRecipient } = buyerInfo(order);
                const isChecked = selected.has(order.id);
                return (
                  <React.Fragment key={order.id}>
                    <tr className={`border-b border-border transition-colors ${isChecked ? "bg-primary/5" : "hover:bg-bg"}`}>
                      <td className="px-4 py-4 align-top">
                        <input type="checkbox" checked={isChecked} onChange={() => toggle(order.id)} className="w-4 h-4 accent-primary" aria-label="Siparişi seç" />
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-mono text-text-light text-xs">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-text-light mt-0.5">{new Date(order.createdAt).toLocaleDateString("tr-TR")}</p>
                        {order.type === "reprint" && <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent/40 text-text">Yeniden Baskı</span>}
                      </td>
                      <td className="px-4 py-4 text-text-light">
                        <p className="text-text font-semibold text-xs">{buyerName}</p>
                        {!sameRecipient && <p className="text-xs mt-0.5"><span className="text-text-light">Teslim alan:</span> {recipientName}</p>}
                        <p className="text-xs mt-0.5">{order.address?.city}</p>
                      </td>
                      <td className="px-4 py-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="mb-1 last:mb-0">
                            <p className="text-text">{item.product?.name} ×{item.quantity}</p>
                            {variantText(item) && <p className="text-xs text-text-light">{variantText(item)}</p>}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-4">
                        <OrderStatusSelect orderId={order.id} currentStatus={order.status} currentCode={order.trackingCode} />
                      </td>
                      <td className="px-4 py-4">
                        <OrderTrackingInput orderId={order.id} currentCode={order.trackingCode} />
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-primary">{Number(order.total).toLocaleString("tr-TR")} ₺</td>
                      <td className="px-4 py-4">
                        <Link href={`/siparisler/${order.id}?from=admin`} className="text-xs text-primary hover:underline font-semibold">Detay</Link>
                      </td>
                    </tr>
                    <tr className="border-b border-border last:border-0 bg-bg/40">
                      <td colSpan={8} className="px-6 pb-3 pt-1">
                        <OrderNoteInput orderId={order.id} currentNote={order.adminNote} />
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
