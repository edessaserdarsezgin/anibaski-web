"use client";

import { useEffect, useState } from "react";

type ProductOpt = { id: string; name: string; slug: string };

/** Koleksiyon içi ürün seçici: ara→ekle, sürükle→sırala, kaldır; Kaydet tek PUT atar. */
export default function CollectionProductsEditor({ collectionId }: { collectionId: string }) {
  const [all, setAll] = useState<ProductOpt[]>([]);
  const [items, setItems] = useState<string[]>([]); // sıralı productId listesi
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch(`/api/admin/collections/${collectionId}/products`),
      ]);
      setAll(pRes.ok ? await pRes.json() : []);
      const rows: { product_id: string }[] = cRes.ok ? await cRes.json() : [];
      setItems(rows.map((r) => r.product_id));
      setLoading(false);
    })();
  }, [collectionId]);

  const nameOf = (id: string) => all.find((p) => p.id === id)?.name ?? id;
  const results = q.trim()
    ? all.filter((p) => !items.includes(p.id) && p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : [];

  function handleDrop(target: number) {
    setOverIdx(null);
    if (dragIdx === null || dragIdx === target) { setDragIdx(null); return; }
    setItems((list) => {
      const next = [...list];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(target, 0, moved);
      return next;
    });
    setDragIdx(null);
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/collections/${collectionId}/products`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map((productId, i) => ({ productId, position: i + 1 })) }),
    });
    setSaving(false);
    setSaved(true);
  }

  if (loading) return <p className="text-sm text-text-light py-3">Yükleniyor...</p>;

  return (
    <div className="mt-3 rounded-xl border border-border bg-bg p-4 flex flex-col gap-3">
      <div className="relative">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); }}
          className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm outline-none focus:border-primary transition-colors"
          placeholder="Ürün ara ve ekle..."
        />
        {results.length > 0 && (
          <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-soft overflow-hidden">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => { setItems((l) => [...l, p.id]); setQ(""); setSaved(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-text hover:bg-bg transition-colors"
                >
                  + {p.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!items.length ? (
        <p className="text-xs text-text-light">Henüz ürün eklenmedi. Yukarıdan arayıp ekleyin.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.map((id, i) => (
            <li
              key={id}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => { e.preventDefault(); setOverIdx(i); }}
              onDragLeave={() => setOverIdx((o) => (o === i ? null : o))}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
              className={`flex items-center justify-between gap-2 py-2 ${overIdx === i ? "border-t-2 border-primary" : ""} ${dragIdx === i ? "opacity-40" : ""}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="cursor-grab active:cursor-grabbing text-text-light/50 select-none" title="Sürükleyerek sırala" aria-hidden>⠿</span>
                <span className="text-xs text-text-light w-5 shrink-0">{i + 1}.</span>
                <span className="text-sm text-text truncate">{nameOf(id)}</span>
              </div>
              <button
                type="button"
                onClick={() => { setItems((l) => l.filter((x) => x !== id)); setSaved(false); }}
                className="text-xs text-red-500 hover:text-red-700 font-semibold shrink-0"
              >
                Kaldır
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-4 py-1.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-xs font-semibold rounded-full transition-colors"
        >
          {saving ? "Kaydediliyor..." : "Ürünleri Kaydet"}
        </button>
        {saved && <span className="text-xs text-green-600 font-semibold">✓ Kaydedildi</span>}
      </div>
    </div>
  );
}
