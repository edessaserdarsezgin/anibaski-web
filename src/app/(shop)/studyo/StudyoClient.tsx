"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type StudioTool } from "@/lib/studio";
import { upscaleViaServer, editViaServer, UpscaleError } from "@/lib/upscaleClient";
import BeforeAfterSlider from "@/components/studio/BeforeAfterSlider";

type Step = "gallery" | "upload" | "processing" | "result";

export default function StudyoClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("gallery");
  const [tool, setTool] = useState<StudioTool | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [credits, setCredits] = useState<{ dailyFreeRemaining: number; earnedAvailable: number; total: number; trial: boolean } | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [tools, setTools] = useState<StudioTool[] | null>(null);

  useEffect(() => {
    fetch("/api/ai/studio/credits")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCredits(d))
      .catch(() => {});
  }, [step]);

  useEffect(() => {
    fetch("/api/ai/studio/tools")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setTools(d))
      .catch(() => setTools([]));
  }, []);

  // Araç seçimi: kredi yoksa içeri hiç girme, uyarı göster (krediyi yüklemeden önce kontrol et)
  function selectTool(t: StudioTool) {
    if (!t.active) return;
    if (!isLoggedIn) { router.push("/giris?redirect=/studyo"); return; }
    if (credits && credits.total <= 0) { setBlocked(true); return; }
    setBlocked(false);
    setTool(t);
    setStep("upload");
  }

  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/bmp"];

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Desteklenmeyen format. Lütfen PNG, JPG, WebP veya AVIF yükleyin.");
      e.target.value = "";
      return;
    }
    setFile(f); setError(null);
  }

  async function handleProcess() {
    if (!file || !tool) return;
    setError(null);
    setStep("processing");
    try {
      const before = URL.createObjectURL(file);
      const after = tool.engine === "edit"
        ? await editViaServer(file, tool.slug)
        : await upscaleViaServer(file);
      setBeforeUrl(before);
      setAfterUrl(after);
      setStep("result");
      // Header rozeti + diğer dinleyiciler anında tazelensin (sayfa yenilemeden)
      window.dispatchEvent(new Event("studio-credits-updated"));
    } catch (err) {
      if (err instanceof UpscaleError && err.code === 401) {
        router.push("/giris?redirect=/studyo");
        return;
      }
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
      const f = new File([blob], "studio-result.png", { type: blob.type || "image/png" });
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.status === 401) { router.push("/giris?redirect=/studyo"); return; }
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
    setFile(null); setBeforeUrl(null); setAfterUrl(null); setError(null); setTool(null); setStep("gallery");
  }

  if (step === "gallery") {
    return (
      <div className="max-w-5xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-3">AnıBaskı AI Stüdyo</p>
          <h1 className="font-serif text-4xl md:text-5xl text-text mb-3">Fotoğraflarını mükemmelleştir</h1>
          <p className="text-secondary">Photoshop gerekmez — yapay zeka senin için yapsın.</p>
          {credits && (
            <p className="mt-4 inline-block text-sm bg-white border border-border rounded-full px-4 py-1.5 text-text">
              {credits.total > 0
                ? credits.trial
                  ? <>Ücretsiz deneme hakkın: <b className="text-primary">{credits.dailyFreeRemaining}</b> — beğenirsen baskıya geç, sonra her gün ücretsiz kredi 🎁</>
                  : <>Bugün <b className="text-primary">{credits.dailyFreeRemaining}</b> ücretsiz
                      {credits.earnedAvailable > 0 && <> + <b className="text-primary">{credits.earnedAvailable}</b> kazanılmış</>} hakkın var</>
                : credits.trial
                  ? <>Deneme hakkın doldu — bir baskı siparişi ver, her gün ücretsiz kredi kazan 🎁</>
                  : <>Hakkın doldu — her 1000 ₺&apos;lik baskıda yeni kredi kazan 🎁</>}
            </p>
          )}
          {blocked && (
            <p className="mt-3 text-sm text-red-700">
              {credits?.trial
                ? <>Deneme hakkın doldu — bir baskı siparişi verince her gün ücretsiz kredi kazanırsın.{" "}</>
                : <>Krediniz doldu — her 1000 ₺&apos;lik baskıda yeni kredi kazanırsınız.{" "}</>}
              <Link href="/urunler" className="font-semibold underline">Baskıya göz at →</Link>
            </p>
          )}
        </div>
        {!isLoggedIn && (
          <div className="mb-8 flex items-center justify-center gap-3 flex-wrap text-sm bg-primary/5 border border-primary/20 rounded-2xl px-5 py-3 text-text">
            <span>Araçları kullanmak için giriş yapın.</span>
            <Link href="/giris?redirect=/studyo" className="font-semibold text-primary hover:underline whitespace-nowrap">Giriş / Kayıt →</Link>
          </div>
        )}
        {tools === null && (
          <p className="text-center text-secondary text-sm py-12">Araçlar yükleniyor...</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(tools ?? []).map((t) => (
            <button
              key={t.slug}
              disabled={!t.active}
              onClick={() => selectTool(t)}
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
        <p className="text-center text-xs text-secondary/70 mt-8">
          Fotoğrafın yalnızca işlem için kullanılır, sunucularımızda saklanmaz.
        </p>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="max-w-2xl mx-auto px-8 py-24 flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-border border-t-primary animate-spin" />
        <h2 className="font-serif text-2xl text-text">Fotoğrafın işleniyor...</h2>
        <p className="text-secondary text-sm">Yapay zeka çalışıyor, birkaç saniye sürebilir.</p>
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
            download="anibaski-studyo.png"
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
        <h1 className="font-serif text-3xl md:text-4xl text-text mb-3">{tool?.name ?? "Stüdyo"}</h1>
        <p className="text-secondary">{tool?.description}</p>
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
          <p className="text-secondary text-sm mt-1">PNG, JPG, WebP, AVIF, BMP</p>
        </div>
        {file && <p className="text-primary font-semibold text-sm">{file.name} ✓</p>}
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/bmp" className="hidden" onChange={pickFile} />
      </div>

      {tool?.generative && (
        <p className="text-xs text-secondary text-center -mt-4">
          ⚠️ Bu yapay zeka efekti fotoğrafı yeniden yorumlar; sonuç orijinalden farklı olabilir. Beğenmezsen basmak zorunda değilsin.
        </p>
      )}

      <button
        onClick={handleProcess}
        disabled={!file}
        className="py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Uygula
      </button>

      <button onClick={reset} className="text-sm text-secondary hover:text-primary transition-colors text-center">
        ← Araçlara dön
      </button>
    </div>
  );
}
