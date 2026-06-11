"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/ToastProvider";

type Settings = { shippingFee: number; freeShippingThreshold: number; codFee: number; productionTime: string; shippingTime: string; orderCutoffNote: string; dispatchCutoffHour: number; dispatchBusinessDays: number; ramazanStart: string; ramazanEnd: string; kurbanStart: string; kurbanEnd: string };

export default function KargoAyarlariPage() {
  const [form, setForm] = useState<Settings>({ shippingFee: 49, freeShippingThreshold: 500, codFee: 30, productionTime: "", shippingTime: "", orderCutoffNote: "", dispatchCutoffHour: 14, dispatchBusinessDays: 0, ramazanStart: "", ramazanEnd: "", kurbanStart: "", kurbanEnd: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/admin/shipping-settings")
      .then(r => r.json())
      .then(data => { setForm(data); setLoading(false); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/shipping-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast("Kargo ayarları kaydedildi.");
    } else {
      toast("Kaydedilemedi.", "error");
    }
    setSaving(false);
  }

  const inputCls = "px-4 py-2.5 rounded-lg border border-border bg-bg text-sm text-text outline-none focus:border-primary transition-colors w-full";

  if (loading) return <div className="text-text-light text-sm">Yükleniyor…</div>;

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-3xl text-text mb-8">Kargo Ayarları</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 flex flex-col gap-6">

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Kargo Ücreti (₺)</label>
          <input
            type="number" min="0" step="0.01" required
            value={form.shippingFee}
            onChange={e => setForm(f => ({ ...f, shippingFee: Number(e.target.value) }))}
            className={inputCls}
          />
          <p className="text-xs text-text-light">Eşiğin altındaki siparişlere uygulanır.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Ücretsiz Kargo Eşiği (₺)</label>
          <input
            type="number" min="0" step="0.01" required
            value={form.freeShippingThreshold}
            onChange={e => setForm(f => ({ ...f, freeShippingThreshold: Number(e.target.value) }))}
            className={inputCls}
          />
          <p className="text-xs text-text-light">Bu tutar ve üzerindeki siparişlerde kargo ücretsiz.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Kapıda Ödeme Hizmet Bedeli (₺)</label>
          <input
            type="number" min="0" step="0.01" required
            value={form.codFee}
            onChange={e => setForm(f => ({ ...f, codFee: Number(e.target.value) }))}
            className={inputCls}
          />
          <p className="text-xs text-text-light">Kapıda ödeme seçildiğinde sipariş toplamına eklenir.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Üretim Süresi</label>
          <input type="text" value={form.productionTime}
            onChange={e => setForm(f => ({ ...f, productionTime: e.target.value }))}
            className={inputCls} placeholder="2–3 iş günü" />
          <p className="text-xs text-text-light">Ürün detayında &quot;Üretim&quot; değeri. Boş = varsayılan.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Kargo Süresi</label>
          <input type="text" value={form.shippingTime}
            onChange={e => setForm(f => ({ ...f, shippingTime: e.target.value }))}
            className={inputCls} placeholder="1–3 iş günü" />
          <p className="text-xs text-text-light">Ürün detayında &quot;Kargo&quot; değeri. Boş = varsayılan.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Sipariş Cutoff Notu</label>
          <textarea value={form.orderCutoffNote}
            onChange={e => setForm(f => ({ ...f, orderCutoffNote: e.target.value }))}
            rows={2} className={`${inputCls} resize-none`} placeholder="Siparişler hafta içi 14:00'a kadar verilirse aynı gün üretime alınır." />
          <p className="text-xs text-text-light">Ürün detayı kargo kutusunun altındaki not. Boş = varsayılan.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Sipariş Cutoff Saati</label>
            <input
              type="number" min="0" max="23" step="1" required
              value={form.dispatchCutoffHour}
              onChange={e => setForm(f => ({ ...f, dispatchCutoffHour: Number(e.target.value) }))}
              className={inputCls}
            />
            <p className="text-xs text-text-light">Hafta içi bu saatten (TR) önceki siparişler aynı gün kabul. Örn: 14.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Kargoya Veriliş (iş günü)</label>
            <input
              type="number" min="0" max="10" step="1" required
              value={form.dispatchBusinessDays}
              onChange={e => setForm(f => ({ ...f, dispatchBusinessDays: Number(e.target.value) }))}
              className={inputCls}
            />
            <p className="text-xs text-text-light"><strong>0 = aynı gün</strong> (cutoff öncesi sipariş bugün kargoda), 1 = ertesi iş günü.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <div>
            <p className="text-sm font-semibold text-text">Dini Bayram Tatilleri</p>
            <p className="text-xs text-text-light mt-0.5">Seçilen tarih aralıkları (başlangıç–bitiş dahil) kargo kapalı sayılır, &quot;Ne zaman kargoda&quot; tahmininden çıkarılır. Diyanet&apos;in resmî tarihlerini gir. Resmî tatiller (1 Ocak, 23 Nisan, 1/19 Mayıs, 15 Temmuz, 30 Ağustos, 29 Ekim) zaten otomatik.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text">Ramazan Bayramı</label>
            <div className="flex items-center gap-2">
              <input type="date" value={form.ramazanStart}
                onChange={e => setForm(f => ({ ...f, ramazanStart: e.target.value }))} className={inputCls} />
              <span className="text-text-light text-sm shrink-0">→</span>
              <input type="date" value={form.ramazanEnd} min={form.ramazanStart || undefined}
                onChange={e => setForm(f => ({ ...f, ramazanEnd: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text">Kurban Bayramı</label>
            <div className="flex items-center gap-2">
              <input type="date" value={form.kurbanStart}
                onChange={e => setForm(f => ({ ...f, kurbanStart: e.target.value }))} className={inputCls} />
              <span className="text-text-light text-sm shrink-0">→</span>
              <input type="date" value={form.kurbanEnd} min={form.kurbanStart || undefined}
                onChange={e => setForm(f => ({ ...f, kurbanEnd: e.target.value }))} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="bg-bg rounded-xl p-4 text-sm text-text-light mb-4">
            <p className="font-semibold text-text mb-1">Önizleme</p>
            <p>Kargo: <span className="text-text font-semibold">{form.shippingFee} ₺</span></p>
            <p>{form.freeShippingThreshold} ₺ üzeri: <span className="text-green-600 font-semibold">Ücretsiz kargo</span></p>
            <p>Kapıda ödeme farkı: <span className="text-text font-semibold">+{form.codFee} ₺</span></p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
