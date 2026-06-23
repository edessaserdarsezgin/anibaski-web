"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Question = {
  id: string;
  question: string;
  answer: string | null;
  isVisible: boolean;
  answeredAt: string | null;
  createdAt: string;
  product: { name: string; slug: string } | null;
  profile: { fullName: string | null; email: string | null } | null;
};

export default function AdminSoruCevapPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unanswered" | "answered">("unanswered");
  const [busy, setBusy] = useState<string | null>(null);
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/questions");
    setQuestions(res.ok ? await res.json() : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveAnswer(id: string) {
    const answer = answerInputs[id]?.trim();
    if (!answer) return;
    setBusy(id);
    await fetch(`/api/admin/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    setBusy(null);
    setAnswerInputs((p) => ({ ...p, [id]: "" }));
    await load();
  }

  async function toggleVisible(id: string, current: boolean) {
    setBusy(id);
    await fetch(`/api/admin/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: !current }),
    });
    setBusy(null);
    await load();
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Bu soruyu kalıcı olarak silmek istiyor musunuz?")) return;
    setBusy(id);
    await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    setBusy(null);
    await load();
  }

  const filtered = questions.filter((q) => {
    if (filter === "unanswered") return !q.answer;
    if (filter === "answered") return !!q.answer;
    return true;
  });

  const counts = {
    all: questions.length,
    unanswered: questions.filter((q) => !q.answer).length,
    answered: questions.filter((q) => !!q.answer).length,
  };

  return (
    <div>
      <h1 className="font-serif text-3xl text-text mb-6">Soru & Cevap</h1>

      <div className="flex gap-2 mb-6">
        {(["unanswered", "answered", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              filter === f
                ? "bg-primary text-white border-primary"
                : "border-border text-text-light hover:border-primary"
            }`}
          >
            {f === "unanswered" ? "Bekleyen" : f === "answered" ? "Cevaplı" : "Tümü"} ({counts[f]})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-text-light">Yükleniyor…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-text-light bg-bg border border-border rounded-xl px-5 py-8 text-center">
          {filter === "unanswered" ? "Bekleyen soru yok 🎉" : "Soru bulunamadı."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((q) => (
            <div key={q.id} className={`bg-white rounded-2xl border p-5 ${!q.answer ? "border-amber-200" : "border-border"}`}>
              {/* Başlık satırı */}
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <Link
                    href={`/urunler/${q.product?.slug ?? ""}`}
                    target="_blank"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {q.product?.name ?? "—"}
                  </Link>
                  <p className="text-xs text-text-light mt-0.5">
                    {q.profile?.fullName ?? q.profile?.email ?? "Bilinmiyor"} ·{" "}
                    {new Date(q.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {!q.answer && (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                      Bekliyor
                    </span>
                  )}
                  {!q.isVisible && (
                    <span className="text-[11px] font-semibold text-text-light bg-bg border border-border rounded-full px-2 py-0.5">
                      Gizli
                    </span>
                  )}
                </div>
              </div>

              {/* Soru */}
              <div className="bg-bg rounded-xl p-3 mb-3">
                <p className="text-xs font-semibold text-text-light mb-1">Soru</p>
                <p className="text-sm text-text">{q.question}</p>
              </div>

              {/* Mevcut cevap */}
              {q.answer && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-3">
                  <p className="text-xs font-semibold text-primary mb-1">Cevabınız</p>
                  <p className="text-sm text-text leading-relaxed">{q.answer}</p>
                </div>
              )}

              {/* Cevap formu */}
              <div className="flex gap-2 mb-3">
                <textarea
                  rows={2}
                  placeholder={q.answer ? "Cevabı düzenle…" : "Cevabı yaz…"}
                  value={answerInputs[q.id] ?? ""}
                  onChange={(e) => setAnswerInputs((p) => ({ ...p, [q.id]: e.target.value }))}
                  className="flex-1 border border-border rounded-xl px-3 py-2 text-sm text-text bg-white focus:outline-none focus:border-primary resize-none"
                />
                <button
                  onClick={() => saveAnswer(q.id)}
                  disabled={busy === q.id || !answerInputs[q.id]?.trim()}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors self-start"
                >
                  {busy === q.id ? "…" : q.answer ? "Güncelle" : "Cevapla"}
                </button>
              </div>

              {/* Aksiyonlar */}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleVisible(q.id, q.isVisible)}
                  disabled={busy === q.id}
                  className="px-3 py-1 text-xs font-semibold rounded-full border border-border text-text-light hover:border-primary hover:text-text transition-colors disabled:opacity-50"
                >
                  {q.isVisible ? "Gizle" : "Göster"}
                </button>
                <button
                  onClick={() => deleteQuestion(q.id)}
                  disabled={busy === q.id}
                  className="px-3 py-1 text-xs font-semibold rounded-full border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
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
