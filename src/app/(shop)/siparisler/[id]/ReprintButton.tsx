"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; productName: string; quantity: number };

export default function ReprintButton({ orderId, items }: { orderId: string; items: Item[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Record<string, number>>({}); // itemId → adet (varlık = seçili)
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggle(it: Item) {
    setSel((prev) => {
      const next = { ...prev };
      if (it.id in next) delete next[it.id];
      else next[it.id] = it.quantity;
      return next;
    });
  }

  async function submit() {
    const chosen = Object.entries(sel).map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (chosen.length === 0) { setError("En az bir kalem seçin."); return; }
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/orders/${orderId}/reprint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: chosen, reason }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Reprint oluşturulamadı."); return; }
    setOpen(false);
    router.push(`/siparisler/${data.reprintOrderId}`);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-semibold px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
      >
        🔁 Yeniden Bas
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !saving && setOpen(false)}
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl text-text mb-1">Yeniden Baskı</h3>
            <p className="text-xs text-text-light mb-4">
              Ücretsiz iş tekrarı oluşturur — müşteriden ödeme alınmaz, ciroya yansımaz.
            </p>

            <div className="flex flex-col gap-2 mb-4">
              {items.map((it) => {
                const checked = it.id in sel;
                return (
                  <div key={it.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${checked ? "border-primary bg-primary/5" : "border-border"}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(it)} className="accent-primary w-4 h-4" />
                    <span className="flex-1 text-sm text-text min-w-0 truncate">{it.productName}</span>
                    {checked ? (
                      <span className="flex items-center gap-1 text-xs text-text-light">
                        <input
                          type="number" min={1} max={it.quantity} value={sel[it.id]}
                          onChange={(e) => setSel((p) => ({ ...p, [it.id]: Math.max(1, Math.min(it.quantity, Number(e.target.value) || 1)) }))}
                          className="w-14 px-2 py-1 rounded border border-border text-sm text-text text-center outline-none focus:border-primary"
                        />
                        / {it.quantity}
                      </span>
                    ) : (
                      <span className="text-xs text-text-light">{it.quantity} adet</span>
                    )}
                  </div>
                );
              })}
            </div>

            <textarea
              placeholder="Sebep (opsiyonel): kargo hasarı, baskı hatası, jest…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm text-text outline-none focus:border-primary resize-none mb-3"
            />

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <div className="flex gap-2 justify-end">
              <button onClick={() => setOpen(false)} disabled={saving}
                className="text-sm font-semibold px-4 py-2 rounded-lg border border-border text-text-light hover:bg-bg transition-colors disabled:opacity-50">
                Vazgeç
              </button>
              <button onClick={submit} disabled={saving}
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? "Oluşturuluyor…" : "Reprint Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
