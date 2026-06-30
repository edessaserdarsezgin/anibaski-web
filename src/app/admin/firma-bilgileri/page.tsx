"use client";

import { useState, useEffect } from "react";
import CustomSelect from "@/components/ui/CustomSelect";
import { useToast } from "@/components/ui/ToastProvider";
import type { CompanyInfo } from "@/lib/company";

const EMPTY: CompanyInfo = {
  name: "", address: "", email: "", phone: "", taxOffice: "", taxNo: "",
  mersisNo: "", web: "", tradeRegistryNo: "", kepAddress: "",
  supportPhone: "", workingHours: "", bankName: "", accountHolder: "", iban: "",
  landline: "", contractPhone: "phone",
};

const GROUPS: { title: string; fields: { key: keyof CompanyInfo; label: string; placeholder?: string }[] }[] = [
  {
    title: "Temel Bilgiler",
    fields: [
      { key: "name", label: "Ünvan" },
      { key: "address", label: "Adres" },
      { key: "email", label: "E-posta" },
      { key: "phone", label: "Telefon" },
      { key: "landline", label: "Sabit Telefon" },
      { key: "taxOffice", label: "Vergi Dairesi" },
      { key: "taxNo", label: "Vergi No" },
      { key: "mersisNo", label: "MERSİS No" },
      { key: "web", label: "Web Sitesi" },
    ],
  },
  {
    title: "Ticari Kayıt",
    fields: [
      { key: "tradeRegistryNo", label: "Ticaret Sicil No" },
      { key: "kepAddress", label: "KEP Adresi" },
    ],
  },
  {
    title: "Müşteri İletişim",
    fields: [
      { key: "supportPhone", label: "Destek / WhatsApp Hattı" },
      { key: "workingHours", label: "Çalışma Saatleri" },
    ],
  },
  {
    title: "Banka Bilgileri",
    fields: [
      { key: "bankName", label: "Banka Adı" },
      { key: "accountHolder", label: "Hesap Sahibi" },
      { key: "iban", label: "IBAN", placeholder: "TR.." },
    ],
  },
];

export default function FirmaBilgileriPage() {
  const [form, setForm] = useState<CompanyInfo>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/admin/company-info")
      .then(r => r.json())
      .then(data => { setForm({ ...EMPTY, ...data }); setLoading(false); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/company-info", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) toast("Firma bilgileri kaydedildi.");
    else toast("Kaydedilemedi.", "error");
    setSaving(false);
  }

  const inputCls = "px-4 py-2.5 rounded-lg border border-border bg-bg text-sm text-text outline-none focus:border-primary transition-colors w-full";

  if (loading) return <div className="text-text-light text-sm">Yükleniyor…</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl text-text mb-2">Firma Bilgileri</h1>
      <p className="text-sm text-text-light mb-8">
        Bu bilgiler hukuki sözleşmelerde (cayma hakkı, ön bilgilendirme, mesafeli satış) satıcı bilgisi olarak kullanılır.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {GROUPS.map(group => (
          <div key={group.title} className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-serif text-lg text-text mb-4">{group.title}</h2>
            <div className="flex flex-col gap-4">
              {group.fields.map(field => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text">{field.label}</label>
                  <input
                    value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-lg text-text mb-4">Sözleşme Telefonu</h2>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Sözleşmelerde gösterilecek telefon</label>
            <CustomSelect
              value={form.contractPhone}
              onChange={v => setForm(f => ({ ...f, contractPhone: v as "phone" | "landline" }))}
              ariaLabel="Sözleşme telefonu"
              className={inputCls}
              options={[
                { value: "phone", label: "Cep Telefonu" },
                { value: "landline", label: "Sabit Telefon" },
              ]}
            />
            <p className="text-xs text-text-light">Mesafeli satış, ön bilgilendirme ve cayma belgelerinde bu telefon görünür.</p>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="py-3 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
