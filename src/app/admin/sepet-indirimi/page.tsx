"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/ToastProvider";

type Tier = {
  id: string;
  min_subtotal: number;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  is_active: boolean;
};

const inputCls = "px-3 py-2 text-sm rounded-lg border border-border bg-white outline-none focus:border-primary w-full";

export default function SepetIndirimiPage() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(true);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ minSubtotal: "", discountType: "percentage", discountValue: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/cart-discount");
    const data = await res.json();
    setEnabled(data.enabled);
    setTiers(data.tiers ?? []);
    setLoading(false);
  }

  async function toggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    const res = await fetch("/api/admin/cart-discount", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    if (res.ok) toast(next ? "Sepet indirimi açıldı." : "Sepet indirimi kapatıldı.");
    else { setEnabled(!next); toast("Güncellenemedi.", "error"); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/cart-discount", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast("Kademe eklendi.");
      setForm({ minSubtotal: "", discountType: "percentage", discountValue: "" });
      load();
    } else {
      const d = await res.json();
      toast(d.error ?? "Eklenemedi.", "error");
    }
  }

  async function toggleTier(t: Tier) {
    const res = await fetch(`/api/admin/cart-discount/${t.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.is_active }),
    });
    if (res.ok) load();
  }

  async function deleteTier(id: string) {
    const res = await fetch(`/api/admin/cart-discount/${id}`, { method: "DELETE" });
    if (res.ok) { toast("Kademe silindi."); load(); }
    else toast("Silinemedi.", "error");
  }

  const fmtDiscount = (t: Tier) =>
    t.discount_type === "percentage" ? `%${t.discount_value}` : `${Number(t.discount_value).toLocaleString("tr-TR")} ₺`;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-3xl text-text">Sepet İndirimi</h1>
        <button
          onClick={toggleEnabled}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${enabled ? "text-green-700 bg-green-50 border-green-200 hover:bg-green-100" : "text-text-light bg-bg border-border hover:border-primary"}`}
        >
          <span className={`w-2 h-2 rounded-full ${enabled ? "bg-green-500" : "bg-text-light"}`} />
          {enabled ? "Aktif" : "Pasif"}
        </button>
      </div>
      <p className="text-sm text-text-light mb-8">
        Sepet ara toplamı eşiği geçince otomatik indirim uygulanır (kod gerekmez). Kuponla çakışmaz — müşteriye ikisinden büyüğü uygulanır. Ana anahtar kapalıyken hiçbir kademe çalışmaz.
      </p>

      {/* Yeni kademe */}
      <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-border p-6 mb-6">
        <h2 className="font-serif text-lg text-text mb-4">Yeni Kademe</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text">Sepet Eşiği (₺)</label>
            <input required type="number" min="1" step="0.01" value={form.minSubtotal}
              onChange={e => setForm(p => ({ ...p, minSubtotal: e.target.value }))} placeholder="500" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text">İndirim Türü</label>
            <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}
              className={inputCls}>
              <option value="percentage">Yüzde (%)</option>
              <option value="fixed">Sabit Tutar (₺)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text">{form.discountType === "percentage" ? "Oran (%)" : "Tutar (₺)"}</label>
            <input required type="number" min="1" max={form.discountType === "percentage" ? 99 : undefined} value={form.discountValue}
              onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))} placeholder={form.discountType === "percentage" ? "10" : "50"} className={inputCls} />
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="mt-5 px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors">
          {saving ? "Ekleniyor..." : "Kademe Ekle"}
        </button>
      </form>

      {/* Kademe listesi */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <p className="text-sm text-text-light p-6">Yükleniyor...</p>
        ) : !tiers.length ? (
          <p className="text-sm text-text-light p-6">Henüz kademe yok. Örn: 500₺ üzeri %10.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-bg text-text-light">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Sepet Eşiği</th>
                <th className="text-left px-4 py-3 font-semibold">İndirim</th>
                <th className="text-left px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.id} className={`border-b border-border last:border-0 ${!t.is_active ? "opacity-50" : ""}`}>
                  <td className="px-6 py-4 font-semibold text-text">{Number(t.min_subtotal).toLocaleString("tr-TR")} ₺ üzeri</td>
                  <td className="px-4 py-4 text-primary font-semibold">{fmtDiscount(t)}</td>
                  <td className="px-4 py-4">
                    <button onClick={() => toggleTier(t)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${t.is_active ? "text-green-700 bg-green-50 border-green-200 hover:bg-green-100" : "text-text-light bg-bg border-border hover:border-primary"}`}>
                      {t.is_active ? "Aktif" : "Pasif"}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={() => deleteTier(t.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
