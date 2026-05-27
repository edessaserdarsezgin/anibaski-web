"use client";

import { useState, useEffect } from "react";

type Banner = {
  id: string;
  text: string;
  url: string | null;
  bgColor: string;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
};

const PRESET_COLORS = [
  { label: "Mor", value: "#6d55e8" },
  { label: "Terracotta", value: "#e07a5f" },
  { label: "Lacivert", value: "#3d405b" },
  { label: "Yeşil", value: "#2d6a4f" },
  { label: "Siyah", value: "#1a1a1a" },
];

const LINK_SUGGESTIONS = [
  { label: "Tüm Ürünler", value: "/urunler" },
  { label: "Ürün Rehberi (AI)", value: "/urun-rehberi" },
  { label: "Sepet", value: "/sepet" },
];

export default function AdminBannerPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const emptyForm = { text: "", url: "", bgColor: "#6d55e8", isActive: true, startAt: "", endAt: "" };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/banners");
    setBanners(res.ok ? await res.json() : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.text.trim()) { setError("Metin zorunlu."); return; }
    setSaving(true);
    setError("");

    const body = {
      ...form,
      url: form.url.trim() || null,
      startAt: form.startAt || null,
      endAt: form.endAt || null,
      ...(editingId ? { id: editingId } : {}),
    };

    const res = await fetch("/api/admin/banners", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Kaydedilemedi.");
    } else {
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function toggleActive(banner: Banner) {
    await fetch("/api/admin/banners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: banner.id, text: banner.text, url: banner.url, bgColor: banner.bgColor, isActive: !banner.isActive, startAt: banner.startAt, endAt: banner.endAt }),
    });
    await load();
  }

  async function handleDelete(id: string) {
    await fetch("/api/admin/banners", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  function startEdit(b: Banner) {
    setEditingId(b.id);
    setForm({ text: b.text, url: b.url ?? "", bgColor: b.bgColor, isActive: b.isActive, startAt: b.startAt?.slice(0, 16) ?? "", endAt: b.endAt?.slice(0, 16) ?? "" });
    setShowForm(true);
    setError("");
  }

  const inputCls = "px-3 py-2 rounded-lg border border-border bg-bg text-sm outline-none focus:border-primary transition-colors";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-text">Duyuru Bandı</h1>
        {!showForm && (
          <button
            onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); setError(""); }}
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-full transition-colors"
          >
            + Yeni Banner
          </button>
        )}
      </div>

      {/* Önizleme */}
      {form.text && showForm && (
        <div className="mb-6 rounded-xl overflow-hidden border border-border">
          <p className="text-xs text-text-light px-4 py-2 bg-bg border-b border-border">Önizleme</p>
          <div className="py-2.5 flex items-center justify-center" style={{ backgroundColor: form.bgColor }}>
            <span className="text-sm font-semibold text-white">{form.text}</span>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-border p-6 mb-8 flex flex-col gap-4">
          <h2 className="font-serif text-lg text-text">{editingId ? "Banner Düzenle" : "Yeni Banner"}</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Metin</label>
            <input
              value={form.text}
              onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
              className={inputCls}
              placeholder="Yaz kargo bedava! Kupon: YAZI20 🎉"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">
              Link <span className="font-normal text-text-light">(opsiyonel)</span>
            </label>
            <input
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              className={inputCls}
              placeholder="/urunler  ya da  /kategoriler/fotokitap"
            />
            <div className="flex flex-wrap gap-1.5 mt-1">
              {LINK_SUGGESTIONS.map(s => (
                <button key={s.value} type="button"
                  onClick={() => setForm(f => ({ ...f, url: s.value }))}
                  className="px-3 py-1 rounded-full border border-border text-xs text-text-light hover:border-primary hover:text-primary transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Renk</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button key={c.value} type="button"
                  onClick={() => setForm(f => ({ ...f, bgColor: c.value }))}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${form.bgColor === c.value ? "border-text scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
              <input
                type="color"
                value={form.bgColor}
                onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))}
                className="w-8 h-8 rounded-full cursor-pointer border border-border"
                title="Özel renk"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text">Başlangıç <span className="font-normal text-text-light">(opsiyonel)</span></label>
              <input type="datetime-local" value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text">Bitiş <span className="font-normal text-text-light">(opsiyonel)</span></label>
              <input type="datetime-local" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-primary" />
            <span className="text-sm text-text">Hemen aktif et</span>
          </label>

          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
              className="flex-1 py-2.5 border border-border text-sm font-semibold rounded-full hover:border-primary transition-colors">
              İptal
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-serif text-lg text-text">Mevcut Bannerlar</h2>
        </div>
        {loading ? (
          <p className="text-sm text-text-light p-6">Yükleniyor...</p>
        ) : !banners.length ? (
          <p className="text-sm text-text-light p-6">Henüz banner yok.</p>
        ) : (
          <ul className="divide-y divide-border">
            {banners.map(b => (
              <li key={b.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-3 h-10 rounded-full shrink-0" style={{ backgroundColor: b.bgColor }} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold text-text truncate ${!b.isActive ? "opacity-40" : ""}`}>{b.text}</p>
                  {b.url && <p className="text-xs text-text-light truncate">{b.url}</p>}
                  {(b.startAt || b.endAt) && (
                    <p className="text-xs text-text-light mt-0.5">
                      {b.startAt ? new Date(b.startAt).toLocaleDateString("tr-TR") : "—"} → {b.endAt ? new Date(b.endAt).toLocaleDateString("tr-TR") : "∞"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => toggleActive(b)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${b.isActive ? "bg-green-500" : "bg-border"}`}
                    title={b.isActive ? "Pasife al" : "Aktife al"}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${b.isActive ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
                  </button>
                  <button onClick={() => startEdit(b)} className="text-xs text-primary hover:underline font-semibold">Düzenle</button>
                  <button onClick={() => handleDelete(b.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold">Sil</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
