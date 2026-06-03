"use client";

import { useEffect, useState } from "react";

type Form = { dailyFree: number; orderThreshold: number; orderCreditAmount: number; expiryDays: number; maxEarnedBalance: number };

export default function AiKrediPage() {
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/studio-settings").then((r) => r.json()).then((d) =>
      setForm({
        dailyFree: d.daily_free, orderThreshold: Number(d.order_threshold),
        orderCreditAmount: d.order_credit_amount, expiryDays: d.expiry_days, maxEarnedBalance: d.max_earned_balance,
      }));
  }, []);

  async function save() {
    if (!form) return;
    setSaving(true); setMsg(null);
    const res = await fetch("/api/admin/studio-settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setSaving(false);
    setMsg(res.ok ? "Kaydedildi ✓" : "Hata oluştu");
  }

  if (!form) return <div className="text-secondary">Yükleniyor...</div>;

  const fields: { key: keyof Form; label: string; hint: string }[] = [
    { key: "dailyFree", label: "Günlük ücretsiz kredi", hint: "Her kullanıcıya her gün, devretmez" },
    { key: "orderThreshold", label: "Bonus eşiği (₺)", hint: "Bu tutarın üstündeki siparişe kredi" },
    { key: "orderCreditAmount", label: "Sipariş bonusu (kredi)", hint: "Eşik aşılınca verilen kredi" },
    { key: "expiryDays", label: "Kazanılmış kredi süresi (gün)", hint: "Bu süre sonunda kazanılmış kredi silinir" },
    { key: "maxEarnedBalance", label: "Max kazanılmış bakiye", hint: "Bir kullanıcının tutabileceği üst sınır" },
  ];

  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-2xl text-text mb-6">AI Stüdyo Kredi Ayarları</h1>
      <div className="flex flex-col gap-5">
        {fields.map((f) => (
          <label key={f.key} className="flex flex-col gap-1">
            <span className="font-semibold text-text">{f.label}</span>
            <input
              type="number" value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })}
              className="border border-border rounded-xl px-4 py-2.5"
            />
            <span className="text-xs text-secondary">{f.hint}</span>
          </label>
        ))}
        <button onClick={save} disabled={saving}
          className="py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full disabled:opacity-50">
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
        {msg && <p className="text-sm text-center text-secondary">{msg}</p>}
      </div>
    </div>
  );
}
