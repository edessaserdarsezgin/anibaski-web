"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CustomSelect from "@/components/ui/CustomSelect";

type Props = {
  userId: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  notifyDeliveryContact: boolean;
  landline: string | null;
};

export default function UserEditForm({ userId, fullName, phone, role, notifyDeliveryContact, landline }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: fullName ?? "",
    phone: phone ?? "",
    role,
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

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Kaydedilemedi.");
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-text">Ad Soyad</label>
        <input
          value={form.fullName}
          onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
          className={inputCls}
          placeholder="Adı Soyadı"
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

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-text">Sabit Telefon</label>
        <input
          value={landline ?? "—"}
          disabled
          className={inputCls + " opacity-60 cursor-not-allowed"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-text">Rol</label>
        <CustomSelect
          value={form.role}
          onChange={v => setForm(f => ({ ...f, role: v }))}
          ariaLabel="Rol"
          className={inputCls}
          options={[
            { value: "CUSTOMER", label: "CUSTOMER" },
            { value: "ADMIN", label: "ADMIN" },
          ]}
        />
      </div>

      <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-bg cursor-pointer">
        <input
          type="checkbox"
          checked={form.notify_delivery_contact}
          onChange={e => setForm(f => ({ ...f, notify_delivery_contact: e.target.checked }))}
          className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
        />
        <div>
          <p className="text-sm font-semibold text-text">Teslimat adresindeki kişiye de bildirim gönder</p>
          <p className="text-xs text-text-light mt-0.5">Sipariş bilgilendirmesi adresteki telefona da gider.</p>
        </div>
      </label>

      {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">Güncellendi.</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
      >
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
