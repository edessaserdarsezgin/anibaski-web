"use client";

import { useEffect, useState } from "react";

type Category = { id: string; name: string; slug: string; description: string | null; parentId: string | null };

const TR_MAP: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u",
};

function slugify(text: string) {
  return text.split("").map((c) => TR_MAP[c] ?? c).join("")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminKategorilerPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", slug: "", description: "", parentId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "", description: "", parentId: "" });

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
      body: JSON.stringify({ name: form.name, slug: form.slug, description: form.description, parentId: form.parentId || null }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Hata oluştu.");
    } else {
      setForm({ name: "", slug: "", description: "", parentId: "" });
      await load();
    }
    setSaving(false);
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, slug: cat.slug, description: cat.description ?? "", parentId: cat.parentId ?? "" });
  }

  async function handleUpdate(id: string) {
    await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editForm.name, slug: editForm.slug, description: editForm.description, parentId: editForm.parentId || null }),
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
            <select
              value={form.parentId}
              onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
              className={inputCls}
            >
              <option value="">Üst Kategori yok (ana kategori)</option>
              {parents.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
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
          </div>
          {loading ? (
            <p className="text-sm text-text-light p-6">Yükleniyor...</p>
          ) : !categories.length ? (
            <p className="text-sm text-text-light p-6">Henüz kategori yok.</p>
          ) : (
            <ul className="divide-y divide-border">
              {tree.map((cat) => {
                const isChild = !!cat.parentId;
                return (
                  <li key={cat.id} className={`px-6 py-3 ${isChild ? "bg-bg/50" : ""}`}>
                    {editingId === cat.id ? (
                      <div className="flex flex-col gap-2">
                        <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputCls + " w-full"} />
                        <input value={editForm.slug} onChange={e => setEditForm(f => ({ ...f, slug: e.target.value }))} className={inputCls + " w-full"} />
                        <input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className={inputCls + " w-full"} placeholder="Açıklama" />
                        <select value={editForm.parentId} onChange={e => setEditForm(f => ({ ...f, parentId: e.target.value }))} className={inputCls}>
                          <option value="">Ana kategori</option>
                          {parents.filter(p => p.id !== cat.id).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdate(cat.id)} className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-full">Kaydet</button>
                          <button onClick={() => setEditingId(null)} className="px-4 py-1.5 border border-border text-xs font-semibold rounded-full">İptal</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className={isChild ? "pl-4 border-l-2 border-primary/30" : ""}>
                          <div className="flex items-center gap-2">
                            {isChild && <span className="text-xs text-primary/60">↳</span>}
                            <p className="text-sm font-semibold text-text">{cat.name}</p>
                          </div>
                          <p className="text-xs text-text-light">{cat.slug}</p>
                        </div>
                        <div className="flex gap-3">
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
