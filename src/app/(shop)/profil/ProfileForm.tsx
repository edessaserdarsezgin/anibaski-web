"use client";

import { useState } from "react";

type Props = {
  fullName: string | null;
  phone: string | null;
  email: string;
  notifyDeliveryContact: boolean;
};

export default function ProfileForm({ fullName, phone, email, notifyDeliveryContact }: Props) {
  const [form, setForm] = useState({
    fullName: fullName ?? "",
    phone: phone ?? "",
    notify_delivery_contact: notifyDeliveryContact,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const inputCls = "px-4 py-2.5 rounded-lg border border-border bg-bg text-sm outline-none focus:border-primary transition-colors w-full";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Kaydedilemedi.");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-text">E-posta</label>
        <input value={email} disabled
          className={inputCls + " opacity-50 cursor-not-allowed"} />
        <p className="text-xs text-text-light">E-posta değiştirilemez.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-text">Ad Soyad</label>
        <input
          value={form.fullName}
          onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
          className={inputCls}
          placeholder="Adınız Soyadınız"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-text">Telefon</label>
        <input
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          className={inputCls}
          placeholder="05xx xxx xx xx"
          type="tel"
        />
      </div>

      <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-bg hover:border-primary/40 cursor-pointer transition-colors">
        <input
          type="checkbox"
          checked={form.notify_delivery_contact}
          onChange={e => setForm(f => ({ ...f, notify_delivery_contact: e.target.checked }))}
          className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
        />
        <div>
          <p className="text-sm font-semibold text-text">Teslimat adresindeki kişiye de bildirim gönder</p>
          <p className="text-xs text-text-light mt-0.5">
            Farklı bir kişiye gönderim yapıyorsanız, sipariş ve kargo bilgilendirmesi onun telefonuna da WhatsApp ile iletilsin.
          </p>
        </div>
      </label>

      {error &&<p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">Bilgiler kaydedildi.</p>}

      <button type="submit" disabled={saving}
        className="self-start px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors">
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
