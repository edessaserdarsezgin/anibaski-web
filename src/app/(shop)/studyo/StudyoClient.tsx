"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type StudioTool } from "@/lib/studio";
import { upscaleViaServer, editViaServer, UpscaleError } from "@/lib/upscaleClient";
import BeforeAfterSlider from "@/components/studio/BeforeAfterSlider";

const EXAMPLES = [
  { label: "Anime Efekti", before: "/IMG-20240703-WA0002a.jpg", after: "/anibaski-studyoa.png" },
  { label: "Pixar 3D", before: "/IMG-20240703-WA0002a.jpg", after: "/rahsan-serdar-pixar.png" },
  { label: "Pixel Art", before: "/deniz-once.jpeg", after: "/deniz-pixelart.png" },
];

const PRINT_OPTIONS = [
  { icon: "🖼️", name: "Fotoğraf Baskısı", href: "/kategoriler/klasik-baskilar" },
  { icon: "🎨", name: "Kanvas Tablo", href: "/kategoriler/kanvas-tablolar" },
  { icon: "☕", name: "Kupa", href: "/kategoriler/kupalar" },
  { icon: "🪟", name: "Cam Baskı", href: "/kategoriler/cam-baski" },
  { icon: "🖼️", name: "Çerçeveli Baskı", href: "/kategoriler/cerceveler" },
  { icon: "🧲", name: "Magnet", href: "/kategoriler/magnetler" },
];

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
  const [creditInfo, setCreditInfo] = useState<{ orderThreshold: number; orderCreditAmount: number } | null>(null);

  useEffect(() => {
    fetch("/api/ai/studio/credits")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCredits(d))
      .catch(() => {});
  }, [step]);

  useEffect(() => {
    fetch("/api/studio-credit-info")
      .then((r) => r.json())
      .then(setCreditInfo)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/ai/studio/tools")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setTools(d))
      .catch(() => setTools([]));
  }, []);

  const creditThreshold = creditInfo?.orderThreshold ?? 1000;
  const creditAmount = creditInfo?.orderCreditAmount ?? 10;
  const creditThresholdText = creditThreshold.toLocaleString("tr-TR");

  function scrollTop() { window.scrollTo({ top: 0, behavior: "smooth" }); }

  // Araç seçimi: kredi yoksa içeri hiç girme, uyarı göster (krediyi yüklemeden önce kontrol et)
  function selectTool(t: StudioTool) {
    if (!t.active) return;
    if (!isLoggedIn) { router.push("/giris?redirect=/studyo"); return; }
    if (credits && credits.total <= 0) { setBlocked(true); return; }
    setBlocked(false);
    setTool(t);
    setStep("upload");
    scrollTop();
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
    scrollTop();
    try {
      const before = URL.createObjectURL(file);
      const after = tool.engine === "edit"
        ? await editViaServer(file, tool.slug)
        : await upscaleViaServer(file);
      setBeforeUrl(before);
      setAfterUrl(after);
      setStep("result");
      scrollTop();
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
    scrollTop();
  }

  if (step === "gallery") {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 flex flex-col gap-16">

        {/* Kredi yetersiz modal */}
        {blocked && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setBlocked(false)}
          >
            <div
              className="bg-bg rounded-3xl border border-border p-8 max-w-sm w-full flex flex-col gap-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-4xl text-center">🎁</div>
              <div className="text-center">
                <h2 className="font-serif text-xl text-text mb-2">
                  {credits?.trial ? "Deneme hakkın doldu" : "Kredin doldu"}
                </h2>
                <p className="text-sm text-text-light leading-relaxed">
                  {credits?.trial
                    ? "Bir baskı siparişi verince her gün ücretsiz AI Stüdyo kredisi kazanmaya başlarsın."
                    : `${creditThresholdText} ₺ ve üzeri baskı siparişinde ${creditAmount} kredi kazanırsınız. Şimdi bir baskı seç, kredin otomatik yüklensin.`}
                </p>
              </div>
              <Link
                href="/urunler"
                className="w-full text-center py-3 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-full transition-colors"
              >
                Baskılara Göz At →
              </Link>
              <button
                onClick={() => setBlocked(false)}
                className="text-xs text-text-light hover:text-text transition-colors text-center"
              >
                Şimdi değil
              </button>
            </div>
          </div>
        )}

        {/* Başlık + akış */}
        <div className="text-center flex flex-col items-center gap-5">
          <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase">AnıBaskı AI Stüdyo</p>
          <h1 className="font-serif text-4xl md:text-5xl text-text">Fotoğraflarını mükemmelleştir</h1>
          <p className="text-secondary">Photoshop gerekmez — yapay zeka senin için yapsın.</p>

          {/* 3-adım akışı */}
          <div className="flex items-center gap-2 flex-wrap justify-center text-sm mt-1">
            {[
              { icon: "📤", label: "Fotoğraf yükle" },
              { icon: "✨", label: "AI ile işle" },
              { icon: "🖨️", label: "Baskıya gönder", accent: true },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border ${
                  s.accent ? "bg-primary/10 border-primary/30 text-primary font-semibold" : "bg-bg border-border text-text"
                }`}>
                  {s.icon} {s.label}
                </span>
                {i < 2 && <span className="text-border">›</span>}
              </div>
            ))}
          </div>

          {credits && (
            <p className="text-sm bg-white border border-border rounded-full px-4 py-1.5 text-text">
              {credits.total > 0
                ? credits.trial
                  ? <>Ücretsiz deneme hakkın: <b className="text-primary">{credits.dailyFreeRemaining}</b> — beğenirsen baskıya geç, sonra her gün ücretsiz kredi 🎁</>
                  : <>Bugün <b className="text-primary">{credits.dailyFreeRemaining}</b> ücretsiz
                      {credits.earnedAvailable > 0 && <> + <b className="text-primary">{credits.earnedAvailable}</b> kazanılmış</>} hakkın var</>
                : credits.trial
                  ? <>Deneme hakkın doldu — bir baskı siparişi ver, her gün ücretsiz kredi kazan 🎁</>
                  : <>Hakkın doldu — {creditThresholdText} ₺ ve üzeri siparişte {creditAmount} kredi kazan 🎁</>}
            </p>
          )}
          {!isLoggedIn && (
            <div className="flex items-center gap-3 flex-wrap text-sm bg-primary/5 border border-primary/20 rounded-2xl px-5 py-3 text-text">
              <span>Araçları kullanmak için giriş yapın.</span>
              <Link href="/giris?redirect=/studyo" className="font-semibold text-primary hover:underline whitespace-nowrap">Giriş / Kayıt →</Link>
            </div>
          )}
        </div>

        {/* Önce / Sonra örnekleri */}
        <div className="flex flex-col gap-4">
          <h2 className="font-serif text-xl text-text">Neler yapabilirsin?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {EXAMPLES.map((ex) => (
              <div key={ex.label} className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-secondary uppercase tracking-wide">{ex.label}</p>
                <BeforeAfterSlider before={ex.before} after={ex.after} aspectRatio={4 / 3} />
              </div>
            ))}
          </div>
        </div>

        {/* Araç kartları */}
        <div className="flex flex-col gap-4">
          <h2 className="font-serif text-xl text-text">Bir araç seç</h2>
          {tools === null && (
            <p className="text-secondary text-sm py-8 text-center">Araçlar yükleniyor...</p>
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
          <p className="text-xs text-secondary/70 text-center pt-2">
            Fotoğrafın yalnızca işlem için kullanılır, sunucularımızda saklanmaz.
          </p>
        </div>

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
        <BeforeAfterSlider before={beforeUrl} after={afterUrl} fit="contain" />
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

        {/* Baskı seçenekleri */}
        <div className="border-t border-border pt-5 flex flex-col gap-3">
          <p className="text-xs text-secondary font-semibold uppercase tracking-widest text-center">Bu görseli ne üzerine bastıralım?</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {PRINT_OPTIONS.map((opt) => (
              <Link
                key={opt.name}
                href={opt.href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-white text-text text-xs font-medium hover:border-primary hover:text-primary transition-colors"
              >
                <span>{opt.icon}</span> {opt.name}
              </Link>
            ))}
          </div>
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
