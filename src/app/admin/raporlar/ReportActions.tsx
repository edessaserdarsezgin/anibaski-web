"use client";

type OrderRow = { id: string; createdAt: string; status: string; total: number; paymentMethod: string | null; paymentStatus: string | null; customerName: string };
type ProductRow = { name: string; quantity: number; revenue: number; cancelledQty: number };

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(esc).join(";"), ...rows.map((r) => r.map(esc).join(";"))];
  return "﻿" + lines.join("\r\n");
}

function download(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

const fmtDate = (iso: string) => new Date(iso).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
const label = (o: OrderRow) => (o.paymentMethod === "cod" ? "Kapıda" : "PayTR");

export default function ReportActions({ orders, products, range }: { orders: OrderRow[]; products: ProductRow[]; range: { fromDate: string; toDate: string } }) {
  const suffix = `${range.fromDate}_${range.toDate}`;
  const btn = "px-4 py-2 border border-border bg-white hover:bg-bg text-sm font-semibold text-text rounded-full transition-colors";

  function exportOrders() {
    download(`rapor-siparisler-${suffix}.csv`, toCsv(
      ["Sipariş No", "Tarih", "Müşteri", "Durum", "Ödeme", "Tutar"],
      orders.map((o) => [o.id.slice(0, 8), fmtDate(o.createdAt), o.customerName, o.status, label(o), o.total]),
    ));
  }
  function exportProducts() {
    download(`rapor-urunler-${suffix}.csv`, toCsv(
      ["Ürün", "Satılan Adet", "Ciro", "İptal Adet"],
      products.map((p) => [p.name, p.quantity, p.revenue, p.cancelledQty]),
    ));
  }

  return (
    <div className="flex gap-2 flex-wrap print:hidden">
      <button onClick={exportOrders} className={btn}>CSV indir (siparişler)</button>
      <button onClick={exportProducts} className={btn}>CSV indir (ürünler)</button>
      <button onClick={() => window.print()} className={btn}>🖨️ Yazdır / PDF</button>
    </div>
  );
}
