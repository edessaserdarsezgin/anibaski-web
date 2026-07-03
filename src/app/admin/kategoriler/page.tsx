"use client";

import { useEffect, useState } from "react";
import CustomSelect from "@/components/ui/CustomSelect";
import { slugify } from "@/lib/slug";
import ImageField from "@/components/admin/ImageField";

type Category = { id: string; name: string; slug: string; description: string | null; parentId: string | null; imageUrl?: string | null; show_on_home?: boolean; home_position?: number; sort_order?: number; is_active?: boolean; metaTitle?: string | null; metaDescription?: string | null; hero_image?: string | null; theme_color?: string | null; cta_label?: string | null; cta_href?: string | null };

export default function AdminKategorilerPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", slug: "", description: "", parentId: "", imageUrl: "", metaTitle: "", metaDescription: "", hero_image: "", theme_color: "", cta_label: "", cta_href: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "", description: "", parentId: "", imageUrl: "", show_on_home: false, home_position: 0, metaTitle: "", metaDescription: "", hero_image: "", theme_color: "", cta_label: "", cta_href: "" });
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
    const res = await fetch("/api/admin/categories");
    setCategories(res.ok ? await res.json() : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, slug: form.slug, description: form.description, parentId: form.parentId || null, imageUrl: form.imageUrl || null, metaTitle: form.metaTitle || null, metaDescription: form.metaDescription || null, hero_image: form.hero_image || null, theme_color: form.theme_color || null, cta_label: form.cta_label || null, cta_href: form.cta_href || null }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Hata oluştu.");
    } else {
      setForm({ name: "", slug: "", description: "", parentId: "", imageUrl: "", metaTitle: "", metaDescription: "", hero_image: "", theme_color: "", cta_label: "", cta_href: "" });
      await load();
    }
    setSaving(false);
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, slug: cat.slug, description: cat.description ?? "", parentId: cat.parentId ?? "", imageUrl: cat.imageUrl ?? "", show_on_home: cat.show_on_home ?? false, home_position: cat.home_position ?? 0, metaTitle: cat.metaTitle ?? "", metaDescription: cat.metaDescription ?? "", hero_image: cat.hero_image ?? "", theme_color: cat.theme_color ?? "", cta_label: cat.cta_label ?? "", cta_href: cat.cta_href ?? "" });
  }

  async function handleUpdate(id: string) {
    await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editForm.name, slug: editForm.slug, description: editForm.description, parentId: editForm.parentId || null, imageUrl: editForm.imageUrl || null, show_on_home: editForm.show_on_home, home_position: editForm.home_position, metaTitle: editForm.metaTitle || null, metaDescription: editForm.metaDescription || null, hero_image: editForm.hero_image || null, theme_color: editForm.theme_color || null, cta_label: editForm.cta_label || null, cta_href: editForm.cta_href || null }),
    });
    setEditingId(null);
    await load();
  }

  async function handleDelete(id: string) {
    await fetch("/api/admin/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  async function toggleActive(cat: Category) {
    const next = !(cat.is_active ?? true);
    // İyimser: kendisi + (üst kategoriyse) tüm alt kategorileri
    setCategories(cs => cs.map(c =>
      c.id === cat.id || c.parentId === cat.id ? { ...c, is_active: next } : c
    ));
    await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cat.id, is_active: next }),
    });
  }

  /** Sürükleneni hedefin bulunduğu konuma taşı (yalnızca aynı seviye — aynı üst kategori). */
  async function handleDrop(targetId: string) {
    setOverId(null);
    const drag = categories.find(c => c.id === dragId);
    const target = categories.find(c => c.id === targetId);
    setDragId(null);
    if (!drag || !target || drag.id === target.id) return;
    if ((drag.parentId ?? null) !== (target.parentId ?? null)) return; // seviye atlamak yok

    const siblings = categories.filter(c => (c.parentId ?? null) === (drag.parentId ?? null));
    const rest = siblings.filter(c => c.id !== drag.id);
    const targetIdx = rest.findIndex(c => c.id === target.id);
    rest.splice(targetIdx, 0, drag);
    const ordered = rest.map((c, i) => ({ ...c, sort_order: i + 1 }));

    // Yerel state'i güncelle
    const orderMap = new Map(ordered.map(c => [c.id, c.sort_order]));
    setCategories(cs =>
      cs.map(c => orderMap.has(c.id) ? { ...c, sort_order: orderMap.get(c.id) } : c)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    );

    await fetch("/api/admin/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: ordered.map(c => ({ id: c.id, sort_order: c.sort_order })) }),
    });
  }

  const inputCls = "px-3 py-2 rounded-lg border border-border bg-bg text-sm outline-none focus:border-primary transition-colors";
  const parents = categories.filter(c => !c.parentId);

  // Ağaç: önce üst kategoriler, altında girintili alt kategoriler
  const tree: Category[] = [];
  for (const p of parents) {
    tree.push(p);
    for (const c of categories.filter(c => c.parentId === p.id)) {
      tree.push(c);
    }
  }
  // parentId'si hiçbir kategoriye uymayan "yetim" kayıtlar (olmamalı ama güvenlik için)
  for (const c of categories.filter(c => c.parentId && !parents.find(p => p.id === c.parentId))) {
    tree.push(c);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-text mb-8">Kategoriler</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Yeni Kategori */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-lg text-text mb-4">Yeni Kategori</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
              required className={inputCls} placeholder="Kategori Adı"
            />
            <input
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              required className={inputCls} placeholder="slug (otomatik oluşturulur)"
            />
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={inputCls} placeholder="Açıklama (opsiyonel)"
            />
            <input
              value={form.metaTitle}
              onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
              className={inputCls} placeholder="SEO başlık (opsiyonel — boşsa kategori adı)"
            />
            <input
              value={form.metaDescription}
              onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
              className={inputCls} placeholder="SEO açıklama (opsiyonel)"
            />
            <ImageField
              value={form.imageUrl}
              uploading={uploading}
              onUpload={async (f) => { setUploading(true); const url = await uploadImage(f); if (url) setForm(fm => ({ ...fm, imageUrl: url })); setUploading(false); }}
              onClear={() => setForm(fm => ({ ...fm, imageUrl: "" }))}
            />
            <div>
              <p className="text-xs text-text-light mb-1">Banner (geniş — kategori hero)</p>
              <ImageField
                value={form.hero_image}
                uploading={uploading}
                onUpload={async (f) => { setUploading(true); const url = await uploadImage(f); if (url) setForm(fm => ({ ...fm, hero_image: url })); setUploading(false); }}
                onClear={() => setForm(fm => ({ ...fm, hero_image: "" }))}
              />
            </div>
            <label className="flex items-center gap-3 text-sm text-text">
              Tema rengi
              <input type="color" value={form.theme_color || "#e07a5f"}
                onChange={e => setForm(f => ({ ...f, theme_color: e.target.value }))}
                className="w-9 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white" />
              {form.theme_color && (
                <button type="button" onClick={() => setForm(f => ({ ...f, theme_color: "" }))} className="text-xs text-red-500 hover:underline">Temizle</button>
              )}
            </label>
            <input value={form.cta_label} onChange={e => setForm(f => ({ ...f, cta_label: e.target.value }))} className={inputCls} placeholder="CTA buton metni (opsiyonel)" />
            <input value={form.cta_href} onChange={e => setForm(f => ({ ...f, cta_href: e.target.value }))} className={inputCls} placeholder="CTA link (örn. /urunler?tag=kanvas)" />
            <CustomSelect
              value={form.parentId}
              onChange={v => setForm(f => ({ ...f, parentId: v }))}
              ariaLabel="Üst kategori"
              className={inputCls}
              options={[
                { value: "", label: "Üst Kategori yok (ana kategori)" },
                ...parents.map(p => ({ value: p.id, label: p.name })),
              ]}
            />
            {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>}
            <button type="submit" disabled={saving} className="py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors">
              {saving ? "Kaydediliyor..." : "Ekle"}
            </button>
          </form>
        </div>

        {/* Mevcut Kategoriler */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-serif text-lg text-text">Mevcut Kategoriler</h2>
            <p className="text-xs text-text-light mt-1">⠿ tutamağından sürükleyerek sırala · Aktif/Pasif ile menüde göster/gizle</p>
          </div>
          {loading ? (
            <p className="text-sm text-text-light p-6">Yükleniyor...</p>
          ) : !categories.length ? (
            <p className="text-sm text-text-light p-6">Henüz kategori yok.</p>
          ) : (
            <ul className="divide-y divide-border">
              {tree.map((cat) => {
                const isChild = !!cat.parentId;
                const isActive = cat.is_active ?? true;
                const parentActive = isChild ? (categories.find(c => c.id === cat.parentId)?.is_active ?? true) : true;
                const draggable = editingId !== cat.id;
                return (
                  <li
                    key={cat.id}
                    draggable={draggable}
                    onDragStart={() => setDragId(cat.id)}
                    onDragOver={(e) => {
                      // yalnızca aynı seviyedeki hedefte bırakmaya izin ver
                      const drag = categories.find(c => c.id === dragId);
                      if (drag && (drag.parentId ?? null) === (cat.parentId ?? null) && drag.id !== cat.id) {
                        e.preventDefault();
                        setOverId(cat.id);
                      }
                    }}
                    onDragLeave={() => setOverId(o => (o === cat.id ? null : o))}
                    onDrop={() => handleDrop(cat.id)}
                    onDragEnd={() => { setDragId(null); setOverId(null); }}
                    className={`px-6 py-3 transition-colors ${isChild ? "bg-bg/50" : ""} ${!isActive ? "opacity-50" : ""} ${overId === cat.id ? "border-t-2 border-primary" : ""} ${dragId === cat.id ? "opacity-40" : ""}`}
                  >
                    {editingId === cat.id ? (
                      <div className="flex flex-col gap-2">
                        <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputCls + " w-full"} />
                        <input value={editForm.slug} onChange={e => setEditForm(f => ({ ...f, slug: e.target.value }))} className={inputCls + " w-full"} />
                        <input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className={inputCls + " w-full"} placeholder="Açıklama" />
                        <input value={editForm.metaTitle} onChange={e => setEditForm(f => ({ ...f, metaTitle: e.target.value }))} className={inputCls + " w-full"} placeholder="SEO başlık (opsiyonel)" />
                        <input value={editForm.metaDescription} onChange={e => setEditForm(f => ({ ...f, metaDescription: e.target.value }))} className={inputCls + " w-full"} placeholder="SEO açıklama (opsiyonel)" />
                        <ImageField
                          value={editForm.imageUrl}
                          uploading={uploading}
                          onUpload={async (f) => { setUploading(true); const url = await uploadImage(f); if (url) setEditForm(fm => ({ ...fm, imageUrl: url })); setUploading(false); }}
                          onClear={() => setEditForm(fm => ({ ...fm, imageUrl: "" }))}
                        />
                        <div>
                          <p className="text-xs text-text-light mb-1">Banner (geniş — kategori hero)</p>
                          <ImageField
                            value={editForm.hero_image}
                            uploading={uploading}
                            onUpload={async (f) => { setUploading(true); const url = await uploadImage(f); if (url) setEditForm(fm => ({ ...fm, hero_image: url })); setUploading(false); }}
                            onClear={() => setEditForm(fm => ({ ...fm, hero_image: "" }))}
                          />
                        </div>
                        <label className="flex items-center gap-3 text-sm text-text">
                          Tema rengi
                          <input type="color" value={editForm.theme_color || "#e07a5f"}
                            onChange={e => setEditForm(f => ({ ...f, theme_color: e.target.value }))}
                            className="w-9 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white" />
                          {editForm.theme_color && (
                            <button type="button" onClick={() => setEditForm(f => ({ ...f, theme_color: "" }))} className="text-xs text-red-500 hover:underline">Temizle</button>
                          )}
                        </label>
                        <input value={editForm.cta_label} onChange={e => setEditForm(f => ({ ...f, cta_label: e.target.value }))} className={inputCls + " w-full"} placeholder="CTA buton metni (opsiyonel)" />
                        <input value={editForm.cta_href} onChange={e => setEditForm(f => ({ ...f, cta_href: e.target.value }))} className={inputCls + " w-full"} placeholder="CTA link (örn. /urunler?tag=kanvas)" />
                        <CustomSelect
                          value={editForm.parentId}
                          onChange={v => setEditForm(f => ({ ...f, parentId: v }))}
                          ariaLabel="Üst kategori"
                          className={inputCls}
                          options={[
                            { value: "", label: "Ana kategori" },
                            ...parents.filter(p => p.id !== cat.id).map(p => ({ value: p.id, label: p.name })),
                          ]}
                        />
                        <label className="flex items-center gap-2 text-sm text-text">
                          <input type="checkbox" checked={editForm.show_on_home}
                            onChange={e => setEditForm(f => ({ ...f, show_on_home: e.target.checked }))}
                            className="w-4 h-4 accent-primary" />
                          Ana sayfada göster
                        </label>
                        {editForm.show_on_home && (
                          <input type="number" value={editForm.home_position}
                            onChange={e => setEditForm(f => ({ ...f, home_position: Number(e.target.value) }))}
                            className={inputCls + " w-full"} placeholder="Sıra (0 = en üst)" />
                        )}
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdate(cat.id)} className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-full">Kaydet</button>
                          <button onClick={() => setEditingId(null)} className="px-4 py-1.5 border border-border text-xs font-semibold rounded-full">İptal</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="cursor-grab active:cursor-grabbing text-text-light/50 hover:text-text-light select-none" title="Sürükleyerek sırala" aria-hidden>⠿</span>
                          <div className={isChild ? "pl-3 border-l-2 border-primary/30 min-w-0" : "min-w-0"}>
                            <div className="flex items-center gap-2">
                              {isChild && <span className="text-xs text-primary/60">↳</span>}
                              {cat.imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={cat.imageUrl} alt="" className="w-7 h-7 rounded-md object-cover border border-border" />
                              )}
                              <p className="text-sm font-semibold text-text truncate">{cat.name}</p>
                              {!isActive && <span className="text-[10px] font-semibold text-text-light bg-border/60 rounded-full px-2 py-0.5 shrink-0">Pasif</span>}
                            </div>
                            <p className="text-xs text-text-light">{cat.slug}</p>
                            {cat.show_on_home && <p className="text-[10px] text-primary font-semibold">🏠 Ana sayfada (sıra {cat.home_position ?? 0})</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            onClick={() => toggleActive(cat)}
                            disabled={isChild && !parentActive}
                            className={`text-xs font-semibold hover:underline disabled:no-underline disabled:cursor-not-allowed disabled:opacity-60 ${isActive ? "text-green-600" : "text-text-light"}`}
                            title={isChild && !parentActive ? "Üst kategori pasif — önce üstü aktif et" : isActive ? "Pasife al" : "Aktif et"}
                          >
                            {isActive ? "Aktif" : "Pasif"}
                          </button>
                          <button onClick={() => startEdit(cat)} className="text-xs text-primary hover:underline font-semibold">Düzenle</button>
                          <button onClick={() => handleDelete(cat.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold">Sil</button>
                        </div>
                      </div>
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
