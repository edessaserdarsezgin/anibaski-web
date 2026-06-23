"use client";

import { useState } from "react";

type Props = { slug: string; isLoggedIn: boolean };

export default function QuestionForm({ slug, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  if (!isLoggedIn) {
    return (
      <a
        href={`/giris?redirect=/urunler/${slug}`}
        className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors underline underline-offset-2"
      >
        + Soru Sor
      </a>
    );
  }

  if (status === "done") {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-5 py-3">
        Sorunuz alındı, en kısa sürede cevaplayacağız!
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors underline underline-offset-2"
      >
        + Soru Sor
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || question.trim().length < 5) {
      setError("Soru en az 5 karakter olmalı.");
      return;
    }
    setStatus("loading");
    setError("");
    const res = await fetch(`/api/products/${slug}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (res.ok) {
      setStatus("done");
    } else {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? "Bir hata oluştu.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-bg border border-border rounded-2xl p-5">
      <p className="font-semibold text-text text-sm">Soru Sor</p>
      <textarea
        rows={2}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        maxLength={500}
        placeholder="Bu ürün hakkında merak ettiğinizi sorun…"
        className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-text bg-white focus:outline-none focus:border-primary resize-none"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
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
