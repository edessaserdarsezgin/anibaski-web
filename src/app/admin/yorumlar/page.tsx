"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
