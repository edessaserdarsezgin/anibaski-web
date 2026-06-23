"use client";

import { useState } from "react";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl leading-none transition-transform hover:scale-110"
          aria-label={`${s} yıldız`}
        >
          <span className={(hover || value) >= s ? "text-amber-400" : "text-border"}>★</span>
        </button>
      ))}
    </div>
  );
}

type Props = { slug: string; isLoggedIn: boolean; hasReview: boolean };

export default function ReviewForm({ slug, isLoggedIn, hasReview }: Props) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [open, setOpen] = useState(false);

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-text-light bg-bg border border-border rounded-xl px-5 py-4">
        Yorum yapmak için{" "}
        <a href={`/giris?redirect=/urunler/${slug}`} className="text-primary font-semibold hover:underline">
          giriş yapın
        </a>
        .
      </p>
    );
  }

  if (status === "done" || hasReview) {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
        {status === "done" ? "Yorumunuz eklendi, teşekkürler!" : "Bu ürün için yorumunuz zaten mevcut."}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors underline underline-offset-2"
      >
        + Yorum Yaz
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setErrorMsg("Lütfen bir puan seçin."); return; }
    setStatus("loading");
    setErrorMsg("");
    const res = await fetch(`/api/products/${slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, title, body }),
    });
    if (res.ok) {
      setStatus("done");
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg((data as { error?: string }).error ?? "Bir hata oluştu.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-bg border border-border rounded-2xl p-5">
      <p className="font-semibold text-text text-sm">Yorum Yaz</p>

      <div>
        <p className="text-xs text-text-light mb-1.5">Puanınız</p>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="text-xs text-text-light block mb-1.5" htmlFor="review-title">Başlık (isteğe bağlı)</label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Kısa bir başlık"
          className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-white focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="text-xs text-text-light block mb-1.5" htmlFor="review-body">Yorumunuz (isteğe bağlı)</label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Deneyiminizi paylaşın..."
          className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-white focus:outline-none focus:border-primary resize-none"
        />
      </div>

      {(status === "error" || errorMsg) && (
        <p className="text-xs text-red-600">{errorMsg}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-sm font-semibold rounded-full transition-colors"
        >
          {status === "loading" ? "Gönderiliyor…" : "Gönder"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-6 py-2.5 border border-border text-text-light hover:text-text text-sm font-semibold rounded-full transition-colors"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
