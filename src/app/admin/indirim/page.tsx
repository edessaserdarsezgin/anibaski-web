"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/ToastProvider";

type Promo = {
  id: string; name: string; trigger: "auto" | "code"; apply_level: "item" | "cart";
  code: string | null; scope: "all" | "products" | "categories";
  value_type: "percentage" | "fixed"; value: number; min_subtotal: number | null;
  starts_at: string | null; ends_at: string | null; max_uses: number | null; used_count: number;
  first_order_only: boolean; priority: number; is_active: boolean;
  productIds: string[]; categoryIds: string[];
};
type Opt = { id: string; name: string };

// UI tür ↔ (trigger, applyLevel)
type Kind = "oto-urun" | "kupon" | "sepet-esikli";
const kindOf = (p: { trigger: string; apply_level: string }): Kind =>
  p.apply_level === "item" ? "oto-urun" : p.trigger === "code" ? "kupon" : "sepet-esikli";
const KIND_LABEL: Record<Kind, string> = { "oto-urun": "🏷️ Otomatik İndirim", "kupon": "🎟️ Kupon", "sepet-esikli": "🛒 Sepet Eşikli" };

const inputCls = "px-3 py-2 text-sm rounded-lg border border-border bg-white outline-none focus:border-primary w-full";

const emptyForm = {
  name: "", kind: "oto-urun" as Kind, scope: "all" as Promo["scope"],
  valueType: "percentage", value: "", code: "", minSubtotal: "", startsAt: "", endsAt: "",
  maxUses: "", firstOrderOnly: false, priority: "0",
  productIds: [] as string[], categoryIds: [] as string[],
};

export default function IndirimPage() {
  const { toast } = useToast();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [cats, setCats] = useState<Opt[]>([]);
  const [prods, setProds] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    const [p, c, pr] = await Promise.all([
      fetch("/api/admin/promotions").then(r => r.json()),
      fetch("/api/admin/categories").then(r => r.json()).catch(() => []),
      fetch("/api/admin/products").then(r => r.json()).catch(() => []),
    ]);
    setPromos(Array.isArray(p) ? p : []);
    setCats((Array.isArray(c) ? c : []).map((x: Opt) => ({ id: x.id, name: x.name })));
    setProds((Array.isArray(pr) ? pr : []).map((x: Opt) => ({ id: x.id, name: x.name })));
    setLoading(false);
  }

  function payload() {
    const trigger = form.kind === "kupon" ? "code" : "auto";
    const applyLevel = form.kind === "oto-urun" ? "item" : "cart";
    return {
      name: form.name, trigger, applyLevel, scope: form.scope,
      valueType: form.valueType, value: form.value,
      code: form.kind === "kupon" ? form.code : null,
      minSubtotal: form.kind === "sepet-esikli" || form.kind === "kupon" ? form.minSubtotal : null,
      startsAt: form.startsAt || null, endsAt: form.endsAt || null,
      maxUses: form.kind === "kupon" ? form.maxUses : null,
      firstOrderOnly: form.kind === "kupon" ? form.firstOrderOnly : false,
      priority: form.priority,
      productIds: form.scope === "products" ? form.productIds : [],
      categoryIds: form.scope === "categories" ? form.categoryIds : [],
    };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/promotions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) });
    setSaving(false);
    if (res.ok) { toast("İndirim oluşturuldu."); setForm(emptyForm); setShowForm(false); load(); }
    else { const d = await res.json(); toast(d.error ?? "Hata.", "error"); }
  }
  async function toggle(p: Promo) {
    const res = await fetch(`/api/admin/promotions/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !p.is_active }) });
    if (res.ok) load();
  }
  async function del(id: string) {
    const res = await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
    if (res.ok) { toast("Silindi."); load(); } else toast("Silinemedi.", "error");
  }

  const toggleId = (list: string[], id: string) => list.includes(id) ? list.filter(x => x !== id) : [...list, id];
  const fmtVal = (p: Promo) => p.value_type === "percentage" ? `%${p.value}` : `${Number(p.value).toLocaleString("tr-TR")} ₺`;
  const fmtScope = (p: Promo) => p.scope === "all" ? "Tüm ürünler" : p.scope === "categories" ? `${p.categoryIds.length} kategori` : `${p.productIds.length} ürün`;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-3xl text-text">İndirim</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-full transition-colors">+ Yeni İndirim</button>
      </div>
      <p className="text-sm text-text-light mb-6">Otomatik indirimler (ürün/kategori/tüm) kartta görünür; kuponlar kodla; sepet eşikli otomatik. Kupon ile çakışmada müşteriye büyüğü uygulanır.</p>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-border p-6 mb-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text">Ad</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Tablolarda %20" className={inputCls} /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text">Tür</label>
              <select value={form.kind} onChange={e => setForm(f => ({ ...f, kind: e.target.value as Kind }))} className={inputCls}>
                <option value="oto-urun">Otomatik İndirim (kartta görünür)</option>
                <option value="kupon">Kupon (kodlu)</option>
                <option value="sepet-esikli">Sepet Eşikli (otomatik)</option>
              </select></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text">Kapsam</label>
              <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value as Promo["scope"] }))} className={inputCls}>
                <option value="all">Tüm ürünler</option>
                <option value="categories">Kategoriler</option>
                <option value="products">Ürünler</option>
              </select></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text">Değer Tipi</label>
                <select value={form.valueType} onChange={e => setForm(f => ({ ...f, valueType: e.target.value }))} className={inputCls}>
                  <option value="percentage">Yüzde (%)</option><option value="fixed">Sabit (₺)</option>
                </select></div>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text">{form.valueType === "percentage" ? "Oran" : "Tutar"}</label>
                <input required type="number" min="1" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} className={inputCls} /></div>
            </div>
          </div>

          {form.scope === "categories" && (
            <div className="border border-border rounded-lg p-3 max-h-40 overflow-auto flex flex-wrap gap-2">
              {cats.map(c => (
                <label key={c.id} className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer ${form.categoryIds.includes(c.id) ? "bg-primary text-white border-primary" : "border-border"}`}>
                  <input type="checkbox" className="hidden" checked={form.categoryIds.includes(c.id)} onChange={() => setForm(f => ({ ...f, categoryIds: toggleId(f.categoryIds, c.id) }))} />{c.name}
                </label>
              ))}
            </div>
          )}
          {form.scope === "products" && (
            <div className="border border-border rounded-lg p-3 max-h-40 overflow-auto flex flex-wrap gap-2">
              {prods.map(p => (
                <label key={p.id} className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer ${form.productIds.includes(p.id) ? "bg-primary text-white border-primary" : "border-border"}`}>
                  <input type="checkbox" className="hidden" checked={form.productIds.includes(p.id)} onChange={() => setForm(f => ({ ...f, productIds: toggleId(f.productIds, p.id) }))} />{p.name}
                </label>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text">Başlangıç (ops.)</label>
              <input type="date" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} className={inputCls} /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text">Bitiş (ops.)</label>
              <input type="date" value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))} className={inputCls} /></div>
          </div>

          {form.kind === "kupon" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text">Kupon Kodu</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="HOSGELDIN15" className={inputCls} /></div>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text">Maks. Kullanım (ops.)</label>
                <input type="number" min="1" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} className={inputCls} /></div>
              <label className="flex items-center gap-2 cursor-pointer col-span-2">
                <input type="checkbox" checked={form.firstOrderOnly} onChange={e => setForm(f => ({ ...f, firstOrderOnly: e.target.checked }))} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-text">Yalnız ilk sipariş</span></label>
            </div>
          )}
          {(form.kind === "kupon" || form.kind === "sepet-esikli") && (
            <div className="flex flex-col gap-1.5 max-w-[12rem]"><label className="text-xs font-semibold text-text">Min. Sepet (₺)</label>
              <input type="number" min="0" value={form.minSubtotal} onChange={e => setForm(f => ({ ...f, minSubtotal: e.target.value }))} className={inputCls} /></div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors">{saving ? "Kaydediliyor..." : "Kaydet"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-border text-text-light text-sm font-semibold rounded-full hover:border-primary transition-colors">İptal</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading ? <p className="text-sm text-text-light p-6">Yükleniyor...</p>
          : !promos.length ? <p className="text-sm text-text-light p-6">Henüz indirim yok.</p>
          : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-bg text-text-light"><tr>
                <th className="text-left px-6 py-3 font-semibold">Ad</th><th className="text-left px-4 py-3 font-semibold">Tür</th>
                <th className="text-left px-4 py-3 font-semibold">Kapsam</th><th className="text-left px-4 py-3 font-semibold">Değer</th>
                <th className="text-left px-4 py-3 font-semibold">Durum</th><th className="px-4 py-3" />
              </tr></thead>
              <tbody>
                {promos.map(p => (
                  <tr key={p.id} className={`border-b border-border last:border-0 ${!p.is_active ? "opacity-50" : ""}`}>
                    <td className="px-6 py-4 font-semibold text-text">{p.name}{p.code && <span className="ml-2 font-mono text-xs text-text-light">{p.code}</span>}</td>
                    <td className="px-4 py-4 text-text-light">{KIND_LABEL[kindOf(p)]}</td>
                    <td className="px-4 py-4 text-text-light">{fmtScope(p)}</td>
                    <td className="px-4 py-4 text-primary font-semibold">{fmtVal(p)}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => toggle(p)} className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${p.is_active ? "text-green-700 bg-green-50 border-green-200 hover:bg-green-100" : "text-text-light bg-bg border-border hover:border-primary"}`}>{p.is_active ? "Aktif" : "Pasif"}</button>
                    </td>
                    <td className="px-4 py-4 text-right"><button onClick={() => del(p.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold">Sil</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
