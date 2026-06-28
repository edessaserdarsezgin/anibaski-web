"use client";

import { useEffect, useState } from "react";
import ColorPairPicker from "@/components/ui/ColorPairPicker";

type Tag = { id: string; name: string; color: string; text_color?: string; is_active?: boolean };

export default function AdminEtiketlerPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", color: "#e07a5f", text_color: "#ffffff" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", color: "#e07a5f", text_color: "#ffffff" });

  async function load() {
    const res = await fetch("/api/admin/tags");
    setTags(res.ok ? await res.json() : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, color: form.color, text_color: form.text_color }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Hata oluştu.");
    } else {
      setForm({ name: "", color: "#e07a5f", text_color: "#ffffff" });
      await load();
    }
    setSaving(false);
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setEditForm({ name: tag.name, color: tag.color, text_color: tag.text_color ?? "#ffffff" });
  }

  async function handleUpdate(id: string) {
    await fetch("/api/admin/tags", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editForm.name, color: editForm.color, text_color: editForm.text_color }),
    });
    setEditingId(null);
    await load();
  }

  async function toggleActive(tag: Tag) {
    await fetch("/api/admin/tags", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tag.id, is_active: tag.is_active === false }),
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu etiketi silmek istediğinize emin misiniz? Ürünlerden de kaldırılır.")) return;
    await fetch("/api/admin/tags", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  const inputCls = "px-3 py-2 rounded-lg border border-border bg-bg text-sm outline-none focus:border-primary transition-colors";

  return (
    <div>
      <h1 className="font-serif text-3xl text-text mb-8">Etiketler</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Yeni Etiket */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-lg text-text mb-4">Yeni Etiket</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text">Etiket Adı</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                className={inputCls}
                placeholder="Fujifilm Kağıt"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text">Renk</label>
              <div className="flex flex-wrap items-center gap-2">
                <ColorPairPicker
                  bgColor={form.color} textColor={form.text_color}
                  onBgChange={c => setForm(f => ({ ...f, color: c }))}
                  onTextChange={c => setForm(f => ({ ...f, text_color: c }))}
                />
                <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className={inputCls + " flex-1 min-w-0 font-mono uppercase"}
                  placeholder="#e07a5f" pattern="^#[0-9A-Fa-f]{6}$" />
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: form.color, color: form.text_color }}
                >
                  {form.name || "Önizleme"}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
            >
              {saving ? "Kaydediliyor..." : "Ekle"}
            </button>
          </form>
        </div>

        {/* Mevcut Etiketler */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-serif text-lg text-text">Mevcut Etiketler</h2>
          </div>
          {loading ? (
            <p className="text-sm text-text-light p-6">Yükleniyor...</p>
          ) : !tags.length ? (
            <p className="text-sm text-text-light p-6">Henüz etiket yok.</p>
          ) : (
            <ul className="divide-y divide-border">
              {tags.map((tag) => (
                <li key={tag.id} className="px-6 py-3">
                  {editingId === tag.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className={inputCls + " w-full"}
                        placeholder="Etiket Adı"
                      />
                      <div className="flex items-center gap-2">
                        <ColorPairPicker size="sm"
                          bgColor={editForm.color} textColor={editForm.text_color}
                          onBgChange={c => setEditForm(f => ({ ...f, color: c }))}
                          onTextChange={c => setEditForm(f => ({ ...f, text_color: c }))}
                        />
                        <input value={editForm.color}
                          onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))}
                          className={inputCls + " flex-1 font-mono"} />
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
                          style={{ backgroundColor: editForm.color, color: editForm.text_color }}
                        >
                          {editForm.name || "Önizleme"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(tag.id)}
                          className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-full">
                          Kaydet
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="px-4 py-1.5 border border-border text-xs font-semibold rounded-full">
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex items-center justify-between ${tag.is_active === false ? "opacity-50" : ""}`}>
                      <div className="flex items-center gap-3">
                        <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                        <span className="text-sm font-semibold text-text">{tag.name}</span>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: tag.color, color: tag.text_color ?? "#ffffff" }}
                        >
                          {tag.name}
                        </span>
                      </div>
                      <div className="flex gap-3 items-center">
                        <button onClick={() => toggleActive(tag)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${tag.is_active === false ? "text-text-light bg-bg border-border hover:border-primary" : "text-green-700 bg-green-50 border-green-200 hover:bg-green-100"}`}
                          title="Pasifte ürün kartlarında görünmez">
                          {tag.is_active === false ? "Pasif" : "Aktif"}
                        </button>
                        <button onClick={() => startEdit(tag)}
                          className="text-xs text-primary hover:underline font-semibold">
                          Düzenle
                        </button>
                        <button onClick={() => handleDelete(tag.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold">
                          Sil
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
