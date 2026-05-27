"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/ToastProvider";

type Coupon = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
};

export default function KuponlarPage() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "", discountType: "percentage", discountValue: "",
    minOrderAmount: "", maxUses: "", expiresAt: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCoupons(); }, []);

  async function fetchCoupons() {
    setLoading(true);
    const res = await fetch("/api/admin/coupons");
    setCoupons(await res.json());
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast("Kupon oluşturuldu.");
      setShowForm(false);
      setForm({ code: "", discountType: "percentage", discountValue: "", minOrderAmount: "", maxUses: "", expiresAt: "" });
      fetchCoupons();
    } else {
      const data = await res.json();
      toast(data.error ?? "Hata oluştu.", "error");
    }
  }

  async function toggleActive(coupon: Coupon) {
    const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !coupon.is_active }),
    });
    if (res.ok) {
      toast(coupon.is_active ? "Kupon devre dışı bırakıldı." : "Kupon aktif edildi.");
      fetchCoupons();
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    if (res.ok) { toast("Kupon silindi."); fetchCoupons(); }
    else toast("Silinemedi.", "error");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-text">Kupon Kodları</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-full transition-colors"
        >
          + Yeni Kupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-border p-6 mb-6">
          <h2 className="font-serif text-lg text-text mb-4">Yeni Kupon</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text">Kod</label>
              <input required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="YAZA20" className="px-3 py-2 text-sm rounded-lg border border-border outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text">İndirim Türü</label>
              <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}
                className="px-3 py-2 text-sm rounded-lg border border-border outline-none focus:border-primary bg-white">
                <option value="percentage">Yüzde (%)</option>
                <option value="fixed">Sabit Tutar (₺)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text">
                {form.discountType === "percentage" ? "İndirim Oranı (%)" : "İndirim Tutarı (₺)"}
              </label>
              <input required type="number" min="1" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))}
                placeholder={form.discountType === "percentage" ? "20" : "50"} className="px-3 py-2 text-sm rounded-lg border border-border outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text">Min. Sipariş Tutarı (₺) — opsiyonel</label>
              <input type="number" min="0" value={form.minOrderAmount} onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))}
                placeholder="200" className="px-3 py-2 text-sm rounded-lg border border-border outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text">Maks. Kullanım — opsiyonel</label>
              <input type="number" min="1" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                placeholder="100" className="px-3 py-2 text-sm rounded-lg border border-border outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text">Son Kullanım Tarihi — opsiyonel</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                className="px-3 py-2 text-sm rounded-lg border border-border outline-none focus:border-primary" />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-6 py-2.5 border border-border text-text-light text-sm font-semibold rounded-full hover:border-primary transition-colors">
              İptal
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <p className="text-sm text-text-light p-6">Yükleniyor...</p>
        ) : !coupons.length ? (
          <p className="text-sm text-text-light p-6">Henüz kupon yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-bg">
              <tr className="text-text-light">
                <th className="text-left px-6 py-3 font-semibold">Kod</th>
                <th className="text-left px-4 py-3 font-semibold">İndirim</th>
                <th className="text-left px-4 py-3 font-semibold">Min. Tutar</th>
                <th className="text-left px-4 py-3 font-semibold">Kullanım</th>
                <th className="text-left px-4 py-3 font-semibold">Bitiş</th>
                <th className="text-left px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                  <td className="px-6 py-4 font-mono font-semibold text-text">{c.code}</td>
                  <td className="px-4 py-4 text-primary font-semibold">
                    {c.discount_type === "percentage" ? `%${c.discount_value}` : `${Number(c.discount_value).toLocaleString("tr-TR")} ₺`}
                  </td>
                  <td className="px-4 py-4 text-text-light">
                    {c.min_order_amount ? `${Number(c.min_order_amount).toLocaleString("tr-TR")} ₺` : "—"}
                  </td>
                  <td className="px-4 py-4 text-text-light">
                    {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}
                  </td>
                  <td className="px-4 py-4 text-text-light">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString("tr-TR") : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <button onClick={() => toggleActive(c)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                        c.is_active
                          ? "text-green-700 bg-green-50 border-green-200 hover:bg-green-100"
                          : "text-text-light bg-bg border-border hover:border-primary"
                      }`}>
                      {c.is_active ? "Aktif" : "Pasif"}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <button onClick={() => handleDelete(c.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors">
                      Sil
                    </button>
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
