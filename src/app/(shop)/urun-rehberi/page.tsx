"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "upload" | "analyzing" | "recommendation";

type Recommendation = {
  recommendedProduct: string;
  reasoning: string;
  alternativeProduct?: string;
  priceRange?: string;
};

export default function UrunRehberiPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
  }

  function handleDropzoneClick() {
    fileInputRef.current?.click();
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles(dropped);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  async function handleAnalyze() {
    if (files.length === 0) return;
    setError(null);
    setStep("analyzing");

    try {
      const imageUrls: string[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Dosya yüklenemedi");
        const data = await res.json();
        imageUrls.push(data.url);
      }

      const res = await fetch("/api/ai/product-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls, photoCount: files.length }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Analiz yapılamadı");
      }

      const result: Recommendation = await res.json();
      setRecommendation(result);
      setStep("recommendation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analiz yapılamadı, lütfen tekrar deneyin.");
      setStep("upload");
    }
  }

  function handleSelectProduct() {
    sessionStorage.setItem("source", "ai_guided");
    router.push("/urunler");
  }

  function handleRetry() {
    setError(null);
    setFiles([]);
    setStep("upload");
  }

  if (step === "analyzing") {
    return (
      <div className="max-w-2xl mx-auto px-8 py-24 flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-border border-t-primary animate-spin" />
        <h2 className="font-serif text-2xl text-text">Fotoğrafların analiz ediliyor...</h2>
        <p className="text-secondary text-sm">Bu işlem birkaç saniye sürebilir.</p>
      </div>
    );
  }

  if (step === "recommendation" && recommendation) {
    return (
      <div className="max-w-2xl mx-auto px-8 py-16">
        <div className="bg-white rounded-3xl border border-border p-8 flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold text-secondary uppercase tracking-widest mb-2">
              Sana Özel Öneri
            </p>
            <h1 className="font-serif text-3xl text-text">{recommendation.recommendedProduct}</h1>
          </div>

          {recommendation.reasoning && (
            <p className="text-secondary leading-relaxed">{recommendation.reasoning}</p>
          )}

          {recommendation.priceRange && (
            <p className="text-primary font-semibold text-lg">{recommendation.priceRange}</p>
          )}

          <button
            onClick={handleSelectProduct}
            className="py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors text-center"
          >
            Bu Ürünü Seç
          </button>

          {recommendation.alternativeProduct && (
            <p className="text-sm text-secondary text-center">
              Alternatif:{" "}
              <Link
                href="/urunler"
                onClick={() => sessionStorage.setItem("source", "ai_guided")}
                className="text-text font-semibold hover:text-primary transition-colors"
              >
                {recommendation.alternativeProduct}
              </Link>
            </p>
          )}

          <button
            onClick={handleRetry}
            className="text-xs text-secondary hover:text-primary transition-colors text-center"
          >
            Yeniden analiz et
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-16 flex flex-col gap-8">
      <div className="text-center">
        <h1 className="font-serif text-4xl text-text mb-3">
          Fotoğraflarını Yükle, Biz Öneri Yapalım
        </h1>
        <p className="text-secondary leading-relaxed">
          Kaç fotoğrafın olduğunu görünce en ideal baskı ürününü sana öneriyoruz.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={handleRetry}
            className="text-sm font-semibold text-red-700 hover:text-red-900 shrink-0 transition-colors"
          >
            Tekrar dene
          </button>
        </div>
      )}

      <div
        onClick={handleDropzoneClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-border rounded-3xl bg-bg hover:border-primary hover:bg-white transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 py-16 px-8 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-white border border-border flex items-center justify-center text-2xl shadow-sm">
          📷
        </div>
        <div>
          <p className="font-semibold text-text">Fotoğrafları buraya sürükle veya tıkla</p>
          <p className="text-secondary text-sm mt-1">PNG, JPG, HEIC desteklenir</p>
        </div>
        {files.length > 0 && (
          <p className="text-primary font-semibold text-sm">
            {files.length} fotoğraf seçildi
          </p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={files.length === 0}
        className="py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Analiz Et
      </button>

      <p className="text-center text-sm text-secondary">
        <Link href="/urunler" className="hover:text-primary transition-colors">
          Ürünlere kendim bakayım →
        </Link>
      </p>
    </div>
  );
}
