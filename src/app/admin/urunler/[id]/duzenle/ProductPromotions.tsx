"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

type Promo = { id: string; name: string; trigger: "auto" | "code"; apply_level: "item" | "cart"; code: string | null; value_type: string; value: number; is_active: boolean };

/** Ürün editöründe: ürün-kapsamlı indirimleri etiket gibi seç (anında kaydeder). */
export default function ProductPromotions({ productId }: { productId: string }) {
  const { toast } = useToast();
  const [available, setAvailable] = useState<Promo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/products/${productId}/promotions`)
      .then(r => r.json())
      .then(d => { setAvailable(d.available ?? []); setSelected(d.selectedIds ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  async function toggle(pid: string) {
    const next = selected.includes(pid) ? selected.filter(x => x !== pid) : [...selected, pid];
    setSelected(next);
    setSaving(true);
    const res = await fetch(`/api/admin/products/${productId}/promotions`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ promotionIds: next }),
    });
    setSaving(false);
    if (!res.ok) { setSelected(selected); toast("Güncellenemedi.", "error"); }
  }

  const label = (p: Promo) =>
    `${p.name}${p.value_type === "percentage" ? ` (%${p.value})` : ` (${p.value}₺)`}${p.trigger === "code" && p.code ? ` · ${p.code}` : ""}`;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-text">İndirimler {saving && <span className="text-xs text-text-light font-normal">kaydediliyor…</span>}</label>
      <p className="text-xs text-text-light">Bu ürüne uygulanacak ürün-kapsamlı indirim/kuponları seç. Yeni indirim için <a href="/admin/indirim" className="text-primary hover:underline">İndirim</a> sayfası (kapsam: Ürünler).</p>
      {loading ? (
        <p className="text-xs text-text-light">Yükleniyor…</p>
      ) : !available.length ? (
        <p className="text-xs text-text-light">Henüz ürün-kapsamlı indirim yok.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {available.map(p => {
            const on = selected.includes(p.id);
            return (
              <button key={p.id} type="button" onClick={() => toggle(p.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${on ? "bg-primary text-white border-primary" : "border-border text-text hover:border-primary"} ${!p.is_active ? "opacity-50" : ""}`}>
                {label(p)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
