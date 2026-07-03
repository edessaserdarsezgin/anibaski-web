"use client";

import { useEffect, useState } from "react";
import { slugify } from "@/lib/slug";
import ImageField from "@/components/admin/ImageField";
import CollectionProductsEditor from "./CollectionProductsEditor";

type Collection = {
  id: string; name: string; slug: string; description: string | null;
  hero_image: string | null; theme_color: string | null;
  cta_label: string | null; cta_href: string | null;
  metaTitle: string | null; metaDescription: string | null;
  is_active: boolean; show_on_home: boolean; sort_order: number;
};

const EMPTY_FORM = { name: "", slug: "", description: "", metaTitle: "", metaDescription: "", hero_image: "", theme_color: "", cta_label: "", cta_href: "" };

export default function AdminKoleksiyonlarPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM, show_on_home: false });
  const [productsOpenId, setProductsOpenId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  async function uploadImage(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Görsel yüklenemedi.");
      return null;
    }
    const d = await res.json();
    return d.url as string;
  }

  async function load() {
    const res = await fetch("/api/admin/collections");
    setCollections(res.ok ? await res.json() : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/admin/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, slug: form.slug, description: form.description,
        hero_image: form.hero_image || null, theme_color: form.theme_color || null,
        cta_label: form.cta_label || null, cta_href: form.cta_href || null,
        metaTitle: form.metaTitle || null, metaDescription: form.metaDescription || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Hata oluştu.");
    } else {
      setForm({ ...EMPTY_FORM });
      await load();
    }
    setSaving(false);
  }

  function startEdit(col: Collection) {
    setEditingId(col.id);
    setEditForm({
      name: col.name, slug: col.slug, description: col.description ?? "",
      metaTitle: col.metaTitle ?? "", metaDescription: col.metaDescription ?? "",
      hero_image: col.hero_image ?? "", theme_color: col.theme_color ?? "",
      cta_label: col.cta_label ?? "", cta_href: col.cta_href ?? "",
      show_on_home: col.show_on_home,
    });
  }

  async function handleUpdate(id: string) {
    setError("");
    const res = await fetch("/api/admin/collections", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id, name: editForm.name, slug: editForm.slug, description: editForm.description,
        hero_image: editForm.hero_image || null, theme_color: editForm.theme_color || null,
        cta_label: editForm.cta_label || null, cta_href: editForm.cta_href || null,
        metaTitle: editForm.metaTitle || null, metaDescription: editForm.metaDescription || null,
        show_on_home: editForm.show_on_home,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Hata oluştu.");
      return;
    }
    setEditingId(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu koleksiyon silinsin mi? Ürünler silinmez, yalnızca koleksiyon üyelikleri kalkar.")) return;
    await fetch("/api/admin/collections", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  async function toggleActive(col: Collection) {
    const next = !col.is_active;
    setCollections((cs) => cs.map((c) => (c.id === col.id ? { ...c, is_active: next } : c)));
    await fetch("/api/admin/collections", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: col.id, is_active: next }),
    });
  }

  async function handleDrop(targetId: string) {
    setOverId(null);
    const drag = collections.find((c) => c.id === dragId);
    const target = collections.find((c) => c.id === targetId);
    setDragId(null);
    if (!drag || !target || drag.id === target.id) return;

    const rest = collections.filter((c) => c.id !== drag.id);
    const targetIdx = rest.findIndex((c) => c.id === target.id);
    rest.splice(targetIdx, 0, drag);
    const ordered = rest.map((c, i) => ({ ...c, sort_order: i + 1 }));
    setCollections(ordered);

    await fetch("/api/admin/collections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: ordered.map((c) => ({ id: c.id, sort_order: c.sort_order })) }),
    });
  }

  const inputCls = "px-3 py-2 rounded-lg border border-border bg-bg text-sm outline-none focus:border-primary transition-colors";

  return (
    <div>
      <h1 className="font-serif text-3xl text-text mb-8">Koleksiyonlar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Yeni Koleksiyon */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-lg text-text mb-4">Yeni Koleksiyon</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
              required className={inputCls} placeholder="Koleksiyon Adı (örn. Yılbaşı Hediyeleri)"
            />
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              required className={inputCls} placeholder="slug (otomatik oluşturulur)"
            />
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={inputCls} placeholder="Açıklama (opsiyonel — hero'da görünür)"
            />
            <input
              value={form.metaTitle}
              onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
              className={inputCls} placeholder="SEO başlık (opsiyonel — boşsa koleksiyon adı)"
            />
            <input
              value={form.metaDescription}
              onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
              className={inputCls} placeholder="SEO açıklama (opsiyonel)"
            />
            <div>
              <p className="text-xs text-text-light mb-1">Banner (geniş — koleksiyon hero)</p>
              <ImageField
                value={form.hero_image}
                uploading={uploading}
                onUpload={async (f) => { setUploading(true); const url = await uploadImage(f); if (url) setForm((fm) => ({ ...fm, hero_image: url })); setUploading(false); }}
                onClear={() => setForm((fm) => ({ ...fm, hero_image: "" }))}
              />
            </div>
            <label className="flex items-center gap-3 text-sm text-text">
              Tema rengi
              <input type="color" value={form.theme_color || "#e07a5f"}
                onChange={(e) => setForm((f) => ({ ...f, theme_color: e.target.value }))}
                className="w-9 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white" />
              {form.theme_color && (
                <button type="button" onClick={() => setForm((f) => ({ ...f, theme_color: "" }))} className="text-xs text-red-500 hover:underline">Temizle</button>
              )}
            </label>
            <input value={form.cta_label} onChange={(e) => setForm((f) => ({ ...f, cta_label: e.target.value }))} className={inputCls} placeholder="CTA buton metni (opsiyonel)" />
            <input value={form.cta_href} onChange={(e) => setForm((f) => ({ ...f, cta_href: e.target.value }))} className={inputCls} placeholder="CTA link (örn. /fotograf-yukle)" />
            {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>}
            <button type="submit" disabled={saving} className="py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors">
              {saving ? "Kaydediliyor..." : "Ekle"}
            </button>
          </form>
        </div>

        {/* Mevcut Koleksiyonlar */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-serif text-lg text-text">Mevcut Koleksiyonlar</h2>
            <p className="text-xs text-text-light mt-1">⠿ tutamağından sürükleyerek sırala · Ürünler ile içerik seç</p>
          </div>
          {loading ? (
            <p className="text-sm text-text-light p-6">Yükleniyor...</p>
          ) : !collections.length ? (
            <p className="text-sm text-text-light p-6">Henüz koleksiyon yok.</p>
          ) : (
            <ul className="divide-y divide-border">
              {collections.map((col) => {
                const draggable = editingId !== col.id && productsOpenId !== col.id;
                return (
                  <li
                    key={col.id}
                    draggable={draggable}
                    onDragStart={() => setDragId(col.id)}
                    onDragOver={(e) => {
                      const drag = collections.find((c) => c.id === dragId);
                      if (drag && drag.id !== col.id) { e.preventDefault(); setOverId(col.id); }
                    }}
                    onDragLeave={() => setOverId((o) => (o === col.id ? null : o))}
                    onDrop={() => handleDrop(col.id)}
                    onDragEnd={() => { setDragId(null); setOverId(null); }}
                    className={`px-6 py-3 transition-colors ${!col.is_active ? "opacity-50" : ""} ${overId === col.id ? "border-t-2 border-primary" : ""} ${dragId === col.id ? "opacity-40" : ""}`}
                  >
                    {editingId === col.id ? (
                      <div className="flex flex-col gap-2">
                        <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className={inputCls + " w-full"} />
                        <input value={editForm.slug} onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))} className={inputCls + " w-full"} />
                        <input value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className={inputCls + " w-full"} placeholder="Açıklama" />
                        <input value={editForm.metaTitle} onChange={(e) => setEditForm((f) => ({ ...f, metaTitle: e.target.value }))} className={inputCls + " w-full"} placeholder="SEO başlık (opsiyonel)" />
                        <input value={editForm.metaDescription} onChange={(e) => setEditForm((f) => ({ ...f, metaDescription: e.target.value }))} className={inputCls + " w-full"} placeholder="SEO açıklama (opsiyonel)" />
                        <div>
                          <p className="text-xs text-text-light mb-1">Banner (geniş — koleksiyon hero)</p>
                          <ImageField
                            value={editForm.hero_image}
                            uploading={uploading}
                            onUpload={async (f) => { setUploading(true); const url = await uploadImage(f); if (url) setEditForm((fm) => ({ ...fm, hero_image: url })); setUploading(false); }}
                            onClear={() => setEditForm((fm) => ({ ...fm, hero_image: "" }))}
                          />
                        </div>
                        <label className="flex items-center gap-3 text-sm text-text">
                          Tema rengi
                          <input type="color" value={editForm.theme_color || "#e07a5f"}
                            onChange={(e) => setEditForm((f) => ({ ...f, theme_color: e.target.value }))}
                            className="w-9 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white" />
                          {editForm.theme_color && (
                            <button type="button" onClick={() => setEditForm((f) => ({ ...f, theme_color: "" }))} className="text-xs text-red-500 hover:underline">Temizle</button>
                          )}
                        </label>
                        <input value={editForm.cta_label} onChange={(e) => setEditForm((f) => ({ ...f, cta_label: e.target.value }))} className={inputCls + " w-full"} placeholder="CTA buton metni (opsiyonel)" />
                        <input value={editForm.cta_href} onChange={(e) => setEditForm((f) => ({ ...f, cta_href: e.target.value }))} className={inputCls + " w-full"} placeholder="CTA link" />
                        <label className="flex items-center gap-2 text-sm text-text">
                          <input type="checkbox" checked={editForm.show_on_home}
                            onChange={(e) => setEditForm((f) => ({ ...f, show_on_home: e.target.checked }))}
                            className="w-4 h-4 accent-primary" />
                          Ana sayfada göster
                        </label>
                        {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdate(col.id)} className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-full">Kaydet</button>
                          <button onClick={() => { setEditingId(null); setError(""); }} className="px-4 py-1.5 border border-border text-xs font-semibold rounded-full">İptal</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="cursor-grab active:cursor-grabbing text-text-light/50 hover:text-text-light select-none" title="Sürükleyerek sırala" aria-hidden>⠿</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                {col.hero_image && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={col.hero_image} alt="" className="w-7 h-7 rounded-md object-cover border border-border" />
                                )}
                                <p className="text-sm font-semibold text-text truncate">{col.name}</p>
                                {!col.is_active && <span className="text-[10px] font-semibold text-text-light bg-border/60 rounded-full px-2 py-0.5 shrink-0">Pasif</span>}
                              </div>
                              <p className="text-xs text-text-light">{col.slug}</p>
                              {col.show_on_home && <p className="text-[10px] text-primary font-semibold">🏠 Ana sayfada</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              onClick={() => setProductsOpenId((o) => (o === col.id ? null : col.id))}
                              className="text-xs text-text hover:underline font-semibold"
                            >
                              {productsOpenId === col.id ? "Ürünleri Kapat" : "Ürünler"}
                            </button>
                            <button
                              onClick={() => toggleActive(col)}
                              className={`text-xs font-semibold hover:underline ${col.is_active ? "text-green-600" : "text-text-light"}`}
                              title={col.is_active ? "Pasife al" : "Aktif et"}
                            >
                              {col.is_active ? "Aktif" : "Pasif"}
                            </button>
                            <button onClick={() => startEdit(col)} className="text-xs text-primary hover:underline font-semibold">Düzenle</button>
                            <button onClick={() => handleDelete(col.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold">Sil</button>
                          </div>
                        </div>
                        {productsOpenId === col.id && <CollectionProductsEditor collectionId={col.id} />}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
