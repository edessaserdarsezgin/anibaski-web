"use client";

import { useState } from "react";

type Address = {
  id: string; title: string; fullName: string; phone: string;
  address: string; city: string; district: string; zip: string | null;
};

const emptyForm = { title: "", fullName: "", phone: "", address: "", city: "", district: "", zip: "" };

export default function AddressBook({ initial }: { initial: Address[] }) {
  const [addresses, setAddresses] = useState<Address[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputCls = "px-4 py-2.5 rounded-lg border border-border bg-bg text-sm outline-none focus:border-primary transition-colors";

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(addr: Address) {
    setEditId(addr.id);
    setForm({ title: addr.title, fullName: addr.fullName, phone: addr.phone, address: addr.address, city: addr.city, district: addr.district, zip: addr.zip ?? "" });
    setError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = editId ? `/api/addresses/${editId}` : "/api/addresses";
    const method = editId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) { setError(data.error ?? "Kaydedilemedi."); setSaving(false); return; }

    if (editId) {
      setAddresses(prev => prev.map(a => a.id === editId ? data : a));
    } else {
      setAddresses(prev => [data, ...prev]);
    }
    setShowForm(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    setAddresses(prev => prev.filter(a => a.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 && !showForm && (
        <p className="text-sm text-text-light">Henüz kayıtlı adres yok.</p>
      )}

      {/* Adres listesi */}
      {addresses.map(addr => (
        <div key={addr.id} className="rounded-xl border border-border p-4 flex justify-between gap-4">
          <div className="flex flex-col gap-0.5 text-sm">
            <p className="font-semibold text-text">{addr.title}</p>
            <p className="text-text-light">{addr.fullName} · {addr.phone}</p>
            <p className="text-text-light">{addr.address}</p>
            <p className="text-text-light">{addr.district}, {addr.city}{addr.zip ? ` ${addr.zip}` : ""}</p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button onClick={() => openEdit(addr)}
              className="text-xs text-primary hover:underline font-semibold">
              Düzenle
            </button>
            <button onClick={() => handleDelete(addr.id)}
              className="text-xs text-red-400 hover:text-red-600 font-semibold">
              Sil
            </button>
          </div>
        </div>
      ))}

      {/* Adres formu */}
      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl border border-primary p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-text">
            {editId ? "Adresi Düzenle" : "Yeni Adres"}
          </p>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required className={inputCls} placeholder="Adres başlığı (ör: Ev, İş)" />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              required className={inputCls} placeholder="Ad Soyad" />
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              required className={inputCls} placeholder="Telefon" type="tel" />
            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              required className={inputCls} placeholder="İl" />
            <input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
              required className={inputCls} placeholder="İlçe" />
          </div>
          <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            required rows={2} className={inputCls + " resize-none"} placeholder="Mahalle, cadde, sokak, bina no, daire no" />
          <input value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))}
            className={inputCls} placeholder="Posta kodu (opsiyonel)" />

          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2 border border-border text-sm font-semibold rounded-full hover:border-primary transition-colors">
              İptal
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <button onClick={openAdd}
          className="self-start px-5 py-2 border border-border text-sm font-semibold rounded-full hover:border-primary hover:text-primary transition-colors">
          + Yeni Adres Ekle
        </button>
      )}
    </div>
  );
}
