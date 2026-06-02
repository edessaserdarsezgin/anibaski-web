"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { STUDIO_TOOLS } from "@/lib/studio";
import { upscaleInBrowser } from "@/lib/upscaleClient";
import BeforeAfterSlider from "@/components/studio/BeforeAfterSlider";

type Step = "gallery" | "upload" | "processing" | "result";

export default function StudyoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("gallery");
  const [file, setFile] = useState<File | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setError(null); }
  }

  async function handleUpscale() {
    if (!file) return;
    setError(null);
    setStep("processing");
    try {
      const before = URL.createObjectURL(file);
      const after = await upscaleInBrowser(file);
      // kullanımı ölç (fire-and-forget)
      fetch("/api/ai/studio/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "upscale" }),
      }).catch(() => {});
      setBeforeUrl(before);
      setAfterUrl(after);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız");
      setStep("upload");
    }
  }

  async function goToPrint() {
    if (!afterUrl) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await (await fetch(afterUrl)).blob();
      const f = new File([blob], "studio-upscaled.png", { type: blob.type || "image/png" });
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.status === 401) { router.push("/giris?next=/studyo"); return; }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "Yükleme başarısız");
      }
      const { url } = await res.json();
      sessionStorage.setItem("studioEnhancedImage", url);
      router.push("/urunler");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Baskıya aktarılamadı");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFile(null); setBeforeUrl(null); setAfterUrl(null); setError(null); setStep("gallery");
  }

  if (step === "gallery") {
    return (
      <div className="max-w-5xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-3">AnıBaskı AI Stüdyo</p>
          <h1 className="font-serif text-4xl md:text-5xl text-text mb-3">Fotoğraflarını mükemmelleştir</h1>
          <p className="text-secondary">Photoshop gerekmez — yapay zeka senin için yapsın.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {STUDIO_TOOLS.map((t) => (
            <button
              key={t.slug}
              disabled={!t.active}
              onClick={() => t.active && setStep("upload")}
              className={`text-left p-6 rounded-3xl border transition-all ${
                t.active
                  ? "bg-white border-border hover:border-primary hover:-translate-y-0.5 cursor-pointer"
                  : "bg-bg border-border/60 opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="text-3xl mb-3">{t.icon}</div>
              <p className="font-semibold text-text flex items-center gap-2">
                {t.name}
                {!t.active && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/30 text-text-light">Yakında</span>}
              </p>
              <p className="text-sm text-secondary mt-1">{t.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="max-w-2xl mx-auto px-8 py-24 flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-border border-t-primary animate-spin" />
        <h2 className="font-serif text-2xl text-text">Fotoğrafın işleniyor...</h2>
        <p className="text-secondary text-sm">İlk kullanımda yapay zeka modeli indirilirken biraz uzun sürebilir.</p>
      </div>
    );
  }

  if (step === "result" && beforeUrl && afterUrl) {
    return (
      <div className="max-w-2xl mx-auto px-8 py-16 flex flex-col gap-6">
        <h1 className="font-serif text-3xl text-text text-center">İşte sonuç ✨</h1>
        <BeforeAfterSlider before={beforeUrl} after={afterUrl} />
        {error && <p className="text-sm text-red-700 text-center">{error}</p>}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={afterUrl}
            download="anibaski-netlestirilmis.png"
            className="flex-1 py-3.5 text-center bg-white border border-border text-text font-semibold rounded-full hover:border-primary transition-colors"
          >
            İndir
          </a>
          <button
            onClick={goToPrint}
            disabled={busy}
            className="flex-1 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors disabled:opacity-50"
          >
            {busy ? "Aktarılıyor..." : "Baskıya Geç →"}
          </button>
        </div>
        <button onClick={reset} className="text-xs text-secondary hover:text-primary transition-colors text-center">
          Yeni fotoğraf
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-16 flex flex-col gap-8">
      <div className="text-center">
        <h1 className="font-serif text-4xl text-text mb-3">Netleştir & Büyüt</h1>
        <p className="text-secondary">Düşük çözünürlüklü fotoğrafını yükle, baskıya uygun hale getirelim.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">{error}</div>
      )}

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-3xl bg-bg hover:border-primary hover:bg-white transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 py-12 px-8 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-white border border-border flex items-center justify-center text-2xl shadow-sm">📷</div>
        <div>
          <p className="font-semibold text-text">Fotoğrafı seç</p>
          <p className="text-secondary text-sm mt-1">PNG, JPG, WEBP</p>
        </div>
        {file && <p className="text-primary font-semibold text-sm">{file.name} ✓</p>}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
      </div>

      <button
        onClick={handleUpscale}
        disabled={!file}
        className="py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Netleştir
      </button>

      <button onClick={reset} className="text-sm text-secondary hover:text-primary transition-colors text-center">
        ← Araçlara dön
      </button>
    </div>
  );
}
