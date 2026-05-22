"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Photo = {
  url: string;
  path: string;
  preview: string;
  name: string;
  width: number;
  height: number;
  optimizing: boolean;
  optimized: boolean;
};

type PendingItem = {
  productId: string;
  productName: string;
  productImage: string;
  basePrice: number;
  variantSelections: Record<string, unknown>;
  quantity: number;
  unitPrice: number;
  photoCount: number;
};

function getQuality(w: number, h: number) {
  if (!w || !h) return null;
  const mp = (w * h) / 1_000_000;
  if (mp >= 8)  return { label: "Mükemmel", note: "A3 ve büyük baskılar için ideal", cls: "bg-green-500 text-white" };
  if (mp >= 4)  return { label: "İyi", note: "20×30 cm ve altı baskılar için ideal", cls: "bg-green-500 text-white" };
  if (mp >= 2)  return { label: "Orta", note: "13×18 cm ve altı baskılar için uygun", cls: "bg-amber-500 text-white" };
  return { label: "Düşük", note: "Yalnızca 10×15 cm ve altı için uygun", cls: "bg-red-500 text-white" };
}

async function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = URL.createObjectURL(file);
  });
}

export default function FotografYuklePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [item, setItem] = useState<PendingItem | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [optimizingAll, setOptimizingAll] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("pendingPhotoUpload");
    if (!raw) { router.replace("/urunler"); return; }
    try { setItem(JSON.parse(raw)); } catch { router.replace("/urunler"); }
  }, [router]);

  if (!item) return null;

  const required = item.photoCount;
  const done = photos.length >= required;
  const pct = Math.min(100, Math.round((photos.length / required) * 100));
  const hasLowQuality = photos.some(p => {
    const q = getQuality(p.width, p.height);
    return q?.label === "Düşük" || q?.label === "Orta";
  });
  const allOptimized = photos.length > 0 && photos.every(p => p.optimized);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const canAdd = required - photos.length;
    if (canAdd <= 0) return;

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    const MAX_SIZE_BYTES = 20 * 1024 * 1024;

    const validFiles: File[] = [];
    const validationErrors: string[] = [];

    for (const file of Array.from(files).slice(0, canAdd)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        validationErrors.push(`"${file.name}" desteklenmiyor. Yalnızca JPG, PNG, WEBP veya HEIC yükleyebilirsiniz.`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        validationErrors.push(`"${file.name}" çok büyük (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksimum 20 MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      if (!validFiles.length) return;
    } else {
      setError("");
    }

    setUploading(true);
    const results: Photo[] = [];

    for (const file of validFiles) {
      const preview = URL.createObjectURL(file);
      const { width, height } = await readDimensions(file);

      const fd = new FormData();
      fd.append("file", file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.status === 413) {
          setError(`"${file.name}" sunucu tarafında reddedildi.`);
          continue;
        }
        let data: { url?: string; path?: string; error?: string } = {};
        try { data = await res.json(); } catch { /* ignore */ }

        if (res.ok && data.url && data.path) {
          results.push({ url: data.url, path: data.path, preview, name: file.name, width, height, optimizing: false, optimized: false });
        } else {
          setError(data.error ?? "Bir fotoğraf yüklenemedi.");
        }
      } catch {
        setError("Sunucuya bağlanılamadı.");
      }
    }

    setPhotos(prev => [...prev, ...results]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
  }

  async function optimizeAll() {
    setOptimizingAll(true);
    setPhotos(prev => prev.map(p => p.optimized ? p : { ...p, optimizing: true }));

    const updated = await Promise.all(
      photos.map(async (p) => {
        if (p.optimized) return p;
        try {
          const res = await fetch("/api/optimize-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: p.path }),
          });
          const data = await res.json() as { url?: string; path?: string };
          if (res.ok && data.url && data.path) {
            return { ...p, url: data.url, path: data.path, preview: data.url, optimized: true, optimizing: false };
          }
        } catch { /* ignore */ }
        return { ...p, optimizing: false };
      })
    );

    setPhotos(updated);
    setOptimizingAll(false);
  }

  function handleAddToCart() {
    const existing: Record<string, unknown>[] = JSON.parse(localStorage.getItem("cart") ?? "[]");
    existing.push({
      ...item,
      uploadedImages: photos.map(p => p.url),
    });
    localStorage.setItem("cart", JSON.stringify(existing));
    window.dispatchEvent(new Event("cart-updated"));
    sessionStorage.removeItem("pendingPhotoUpload");
    setAdded(true);
    setTimeout(() => router.push("/sepet"), 1000);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      {/* ── Üst bar ─────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/urunler" className="text-sm text-text-light hover:text-primary transition-colors shrink-0">
          ← Geri
        </Link>
        <div className="flex-1">
          <p className="text-xs text-text-light mb-1 truncate">{item.productName}</p>
          <div className="h-2 bg-bg rounded-full overflow-hidden border border-border">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className={`text-sm font-semibold tabular-nums min-w-[48px] text-right ${done ? "text-green-600" : "text-primary"}`}>
          {photos.length}/{required}
        </span>
      </div>

      <h1 className="font-serif text-2xl text-text mb-1">Fotoğraflarınızı Yükleyin</h1>
      <p className="text-sm text-text-light mb-8">
        {done
          ? "Tüm fotoğraflar hazır. Optimize ederek baskı kalitesini artırabilirsiniz."
          : `${required - photos.length} fotoğraf daha ekleyin`}
      </p>

      {/* ── Fotoğraf grid ───────────────────────────── */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
          {photos.map((p, i) => {
            const q = getQuality(p.width, p.height);
            return (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-border group">
                <img src={p.preview} alt={p.name} className="w-full h-full object-cover" />

                {/* Optimizing overlay */}
                {p.optimizing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Sil butonu */}
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                >×</button>

                {/* Optimize rozetı */}
                {p.optimized && (
                  <span className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500 text-white leading-none">
                    ✓ Optimize
                  </span>
                )}

                {/* Kalite rozeti */}
                {q && !p.optimized && (
                  <span className={`absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded leading-none ${q.cls}`}>
                    {q.label}
                  </span>
                )}

                {/* Boyut bilgisi */}
                {p.width > 0 && (
                  <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold text-white bg-black/50 rounded px-1.5 py-0.5 leading-none">
                    {p.width}×{p.height}
                  </span>
                )}

                {/* Sıra numarası */}
                <span className="absolute bottom-1.5 right-1.5 text-[10px] font-bold text-white bg-black/50 rounded px-1.5 py-0.5 leading-none">
                  {i + 1}
                </span>
              </div>
            );
          })}

          {/* Boş slotlar */}
          {!done && Array.from({ length: Math.min(4, required - photos.length) }).map((_, i) => (
            <button key={`slot-${i}`} onClick={() => fileRef.current?.click()} disabled={uploading}
              className="aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center text-border hover:text-primary disabled:opacity-40">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* ── Düşük/orta kalite uyarısı ───────────────── */}
      {hasLowQuality && !allOptimized && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Bazı fotoğraflar düşük veya orta çözünürlükte</p>
            <p className="text-xs text-amber-700 mt-0.5">Baskı kalitesini artırmak için "Baskı için Optimize Et" butonunu kullanın.</p>
          </div>
        </div>
      )}

      {/* ── Büyük drop zone ─────────────────────────── */}
      {photos.length === 0 && (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-video rounded-2xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-4 text-text-light hover:text-primary disabled:opacity-50 mb-4"
        >
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <div className="text-center">
            <p className="font-semibold">{uploading ? "Yükleniyor..." : "Fotoğraf Seç"}</p>
            <p className="text-sm mt-0.5">Toplam {required} adet · JPG, PNG, WEBP</p>
          </div>
        </button>
      )}

      {/* ── Daha fazla ekle ─────────────────────────── */}
      {photos.length > 0 && !done && (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm font-semibold text-text-light hover:border-primary hover:text-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
        >
          {uploading
            ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Yükleniyor...</>
            : `+ Fotoğraf Ekle (${required - photos.length} kaldı)`}
        </button>
      )}

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">{error}</p>
      )}

      {/* ── Optimize butonu ──────────────────────────── */}
      {photos.length > 0 && !allOptimized && (
        <button
          onClick={optimizeAll}
          disabled={optimizingAll}
          className="w-full py-3 mb-3 border border-primary text-primary font-semibold rounded-full hover:bg-primary/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {optimizingAll ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Optimize ediliyor...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Baskı için Optimize Et
            </>
          )}
        </button>
      )}

      {allOptimized && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-3">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tüm fotoğraflar baskı için optimize edildi.
        </div>
      )}

      {/* ── Alt özet + sepete ekle ───────────────────── */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-text-light">{item.productName} × {item.quantity}</span>
          <span className="font-semibold text-primary text-lg">
            {(item.unitPrice * item.quantity).toLocaleString("tr-TR")} ₺
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!done || added}
          className="w-full py-4 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors text-base"
        >
          {added
            ? "✓ Sepete eklendi, yönlendiriliyorsunuz..."
            : done
            ? "Sepete Ekle →"
            : `${required - photos.length} fotoğraf daha ekleyin`}
        </button>
      </div>
    </div>
  );
}
