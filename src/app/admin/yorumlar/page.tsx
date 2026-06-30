"use client";

import { useEffect, useState } from "react";
import CustomSelect from "@/components/ui/CustomSelect";
import Link from "next/link";

type Product = { id: string; name: string; slug: string };

function AddReviewForm({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && products.length === 0) {
      fetch("/api/admin/products").then(r => r.json()).then(setProducts);
    }
  }, [open, products.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) { setError("Ürün seçin."); return; }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, title, body }),
    });
    setSaving(false);
    if (!res.ok) { setError((await res.json()).error); return; }
    setProductId(""); setRating(5); setTitle(""); setBody("");
    setOpen(false);
    onSaved();
  }

  return (
    <div className="mb-6 bg-white border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg transition-colors"
      >
        <span className="font-semibold text-text">+ Yorum Ekle</span>
        <span className="text-text-light text-lg">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <form onSubmit={submit} className="px-5 pb-5 border-t border-border pt-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-text-light mb-1 block">Ürün</label>
            <CustomSelect
              value={productId}
              onChange={setProductId}
              ariaLabel="Ürün"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-bg text-text"
              options={[
                { value: "", label: "— Ürün seçin —" },
                ...products.map(p => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-light mb-1 block">Puan</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`text-2xl transition-colors ${n <= rating ? "text-amber-400" : "text-border"}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-light mb-1 block">Başlık (opsiyonel)</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Yorum başlığı"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-light mb-1 block">Yorum</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={3}
              placeholder="Yorum metni…"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-5 py-2 text-sm font-semibold rounded-full border border-border text-text-light hover:border-primary transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  isApproved: boolean;
  verifiedPurchase: boolean;
  createdAt: string;
  product: { name: string; slug: string } | null;
  profile: { fullName: string | null; email: string | null } | null;
};

function Stars({ n }: { n: number }) {
  return (
    <span>
      <span className="text-amber-400">{"★".repeat(n)}</span>
      <span className="text-border">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export default function AdminYorumlarPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "hidden">("all");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/reviews");
    setReviews(res.ok ? await res.json() : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleApprove(id: string, current: boolean) {
    setBusy(id);
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: !current }),
    });
    setBusy(null);
    await load();
  }

  async function deleteReview(id: string) {
    if (!confirm("Bu yorumu kalıcı olarak silmek istiyor musunuz?")) return;
    setBusy(id);
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setBusy(null);
    await load();
  }

  const filtered = reviews.filter((r) => {
    if (filter === "approved") return r.isApproved;
    if (filter === "hidden") return !r.isApproved;
    return true;
  });

  const counts = {
    all: reviews.length,
    approved: reviews.filter((r) => r.isApproved).length,
    hidden: reviews.filter((r) => !r.isApproved).length,
  };

  return (
    <div>
      <h1 className="font-serif text-3xl text-text mb-6">Ürün Yorumları</h1>

      <AddReviewForm onSaved={load} />

      {/* Filtre */}
      <div className="flex gap-2 mb-6">
        {(["all", "approved", "hidden"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              filter === f
                ? "bg-primary text-white border-primary"
                : "border-border text-text-light hover:border-primary"
            }`}
          >
            {f === "all" ? "Tümü" : f === "approved" ? "Yayında" : "Gizli"} ({counts[f]})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-text-light">Yükleniyor…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-text-light bg-bg border border-border rounded-xl px-5 py-8 text-center">
          Yorum bulunamadı.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r) => (
            <div key={r.id} className={`bg-white rounded-2xl border p-5 ${r.isApproved ? "border-border" : "border-orange-200 bg-orange-50/30"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={`/urunler/${r.product?.slug ?? ""}`}
                    target="_blank"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {r.product?.name ?? "—"}
                  </Link>
                  <p className="text-xs text-text-light">
                    {r.profile?.fullName ?? r.profile?.email ?? "Bilinmiyor"} ·{" "}
                    {new Date(r.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Stars n={r.rating} />
                  {r.verifiedPurchase && (
                    <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                      ✓ Satın Aldı
                    </span>
                  )}
                  {!r.isApproved && (
                    <span className="text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                      Gizli
                    </span>
                  )}
                </div>
              </div>

              {r.title && <p className="text-sm font-semibold text-text mb-1">{r.title}</p>}
              {r.body && <p className="text-sm text-text-light leading-relaxed mb-3">{r.body}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => toggleApprove(r.id, r.isApproved)}
                  disabled={busy === r.id}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-colors disabled:opacity-50 ${
                    r.isApproved
                      ? "border-orange-300 text-orange-700 hover:bg-orange-50"
                      : "border-green-300 text-green-700 hover:bg-green-50"
                  }`}
                >
                  {r.isApproved ? "Gizle" : "Yayınla"}
                </button>
                <button
                  onClick={() => deleteReview(r.id)}
                  disabled={busy === r.id}
                  className="px-4 py-1.5 text-xs font-semibold rounded-full border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
