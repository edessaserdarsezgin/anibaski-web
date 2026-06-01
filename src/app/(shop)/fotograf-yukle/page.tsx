"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { syncCartSnapshot } from "@/hooks/useCart";
import ProductMockup from "@/components/product/ProductMockup";

type Photo = {
  url: string;
  path: string;
  preview: string;
  name: string;
  width: number;
  height: number;
  optimizing: boolean;
  optimized: boolean;
  cropped: boolean;
};

type CropModal = {
  photoIndex: number;
  crop: Point;
  zoom: number;
  aspect: number | undefined;
  locked: boolean;
  croppedAreaPixels: Area | null;
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
  mockupTemplateUrl?: string | null;
};

// Varyant etiketlerinde NxN / N×N deseni arar (örn. "10x15 cm" → 1.5).
// Tip adı admin-tanımlı olduğundan anahtara güvenmeyiz, desen ararız.
function parsePrintRatio(variantSelections: Record<string, unknown>): { ratio: number; label: string } | null {
  for (const v of Object.values(variantSelections)) {
    const label = (v as { label?: string })?.label;
    if (!label) continue;
    const m = label.match(/(\d+)\s*[x×]\s*(\d+)/i);
    if (m) {
      const a = Number(m[1]), b = Number(m[2]);
      if (a > 0 && b > 0) {
        const lo = Math.min(a, b), hi = Math.max(a, b);
        return { ratio: hi / lo, label: `${lo}×${hi}` };
      }
    }
  }
  return null;
}

function getQuality(w: number, h: number) {
  if (!w || !h) return null;
  const mp = (w * h) / 1_000_000;
  if (mp >= 8) return { label: "Mükemmel", cls: "bg-green-500 text-white" };
  if (mp >= 4) return { label: "İyi",      cls: "bg-green-500 text-white" };
  if (mp >= 2) return { label: "Orta",     cls: "bg-amber-500 text-white" };
  return       { label: "Düşük",           cls: "bg-red-500 text-white" };
}

async function readDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = src;
  });
}

async function getCroppedBlob(previewUrl: string, pixelCrop: Area): Promise<Blob> {
  // Görüntüyü fetch→blob ile yükle: blob: ve https: kaynaklarda CORS taint olmadan çalışır.
  // (crossOrigin ile uzak Supabase URL'si canvas'ı taint edip toBlob'u çökertiyordu.)
  const resp = await fetch(previewUrl);
  const srcBlob = await resp.blob();
  const objUrl = URL.createObjectURL(srcBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new window.Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = objUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error("canvas boş"))), "image/jpeg", 0.95)
    );
  } finally {
    URL.revokeObjectURL(objUrl);
  }
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

  const [cropModal, setCropModal] = useState<CropModal | null>(null);
  const [croppingPhoto, setCroppingPhoto] = useState(false);

  // Sipariş edilen baskı oranı (varsa) — crop kutusunu buna kilitlemek için
  const printRatio = item ? parsePrintRatio(item.variantSelections) : null;

  useEffect(() => {
    const raw = sessionStorage.getItem("pendingPhotoUpload");
    if (!raw) { router.replace("/urunler"); return; }
    try { setItem(JSON.parse(raw)); } catch { router.replace("/urunler"); }
  }, [router]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCropModal(s => s ? { ...s, croppedAreaPixels: pixels } : s);
  }, []);

  if (!item) return null;

  const required = item.photoCount;
  const done = photos.length >= required;
  const pct = Math.min(100, Math.round((photos.length / required) * 100));
  const hasLowQuality = photos.some(p => {
    const q = getQuality(p.width, p.height);
    return q?.label === "Düşük" || q?.label === "Orta";
  });
  const allOptimized = photos.length > 0 && photos.every(p => p.optimized);

  /* ── Dosya yükleme ─────────────────────────────── */
  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const canAdd = required - photos.length;
    if (canAdd <= 0) return;

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    const MAX_SIZE_BYTES = 20 * 1024 * 1024;
    const validFiles: File[] = [];
    const errs: string[] = [];

    for (const file of Array.from(files).slice(0, canAdd)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errs.push(`"${file.name}" desteklenmiyor.`); continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        errs.push(`"${file.name}" 20 MB'ı aşıyor.`); continue;
      }
      validFiles.push(file);
    }
    if (errs.length) { setError(errs[0]); if (!validFiles.length) return; } else setError("");

    setUploading(true);

    for (const file of validFiles) {
      const preview = URL.createObjectURL(file);
      const { width, height } = await readDimensions(preview);
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        let data: { url?: string; path?: string; error?: string } = {};
        try { data = await res.json(); } catch { /* ignore */ }
        if (res.ok && data.url && data.path) {
          // Her fotoğraf yüklenir yüklenmez ekrana ekle — toplu beklemeyi önler
          const photo: Photo = { url: data.url, path: data.path, preview, name: file.name, width, height, optimizing: false, optimized: false, cropped: false };
          setPhotos(prev => [...prev, photo]);
        } else {
          setError(data.error ?? "Fotoğraf yüklenemedi.");
        }
      } catch { setError("Sunucuya bağlanılamadı."); }
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  /* ── Fotoğraf sil ──────────────────────────────── */
  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
  }

  /* ── Optimize ──────────────────────────────────── */
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

  /* ── Kırp: modal aç ───────────────────────────── */
  function openCrop(i: number) {
    const photo = photos[i];
    // Baskı oranı varsa fotoğrafın yönüne göre aspect hesapla, kilitli başlat
    const aspect = printRatio
      ? (photo.width >= photo.height ? printRatio.ratio : 1 / printRatio.ratio)
      : undefined;
    setCropModal({ photoIndex: i, crop: { x: 0, y: 0 }, zoom: 1, aspect, locked: !!printRatio, croppedAreaPixels: null });
  }

  /* ── Kırp: uygula ─────────────────────────────── */
  async function applyCrop() {
    if (!cropModal?.croppedAreaPixels) return;
    setCroppingPhoto(true);
    try {
      const photo = photos[cropModal.photoIndex];
      const blob = await getCroppedBlob(photo.preview, cropModal.croppedAreaPixels);
      const croppedFile = new File([blob], photo.name.replace(/\.[^.]+$/, "-kırpılmış.jpg"), { type: "image/jpeg" });
      const preview = URL.createObjectURL(blob);
      const { width, height } = await readDimensions(preview);

      const fd = new FormData();
      fd.append("file", croppedFile);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; path?: string; error?: string };

      if (res.ok && data.url && data.path) {
        setPhotos(prev => prev.map((p, i) =>
          i === cropModal.photoIndex
            ? { ...p, url: data.url!, path: data.path!, preview, width, height, cropped: true, optimized: false }
            : p
        ));
        setCropModal(null);
      } else {
        setError(data.error ?? "Kırpma yüklenemedi.");
      }
    } catch {
      setError("Kırpma işlemi başarısız oldu.");
    }
    setCroppingPhoto(false);
  }

  /* ── Sepete ekle ──────────────────────────────── */
  function handleAddToCart() {
    const existing: Record<string, unknown>[] = JSON.parse(localStorage.getItem("cart") ?? "[]");
    existing.push({ ...item, uploadedImages: photos.map(p => p.url) });
    localStorage.setItem("cart", JSON.stringify(existing));
    window.dispatchEvent(new Event("cart-updated"));
    syncCartSnapshot();
    sessionStorage.removeItem("pendingPhotoUpload");
    setAdded(true);
    setTimeout(() => router.push("/sepet"), 1000);
  }

  /* ── Render ────────────────────────────────────── */
  return (
    <>
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Üst bar */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/urunler" className="text-sm text-text-light hover:text-primary transition-colors shrink-0">← Geri</Link>
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
            ? "Tüm fotoğraflar hazır. Kırpabilir, optimize edebilirsiniz."
            : `${required - photos.length} fotoğraf daha ekleyin`}
        </p>

        {/* Mockup önizleme */}
        {photos.length > 0 && item.mockupTemplateUrl && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-primary" />
              <p className="text-sm font-semibold text-text">Ürün Önizleme</p>
              <span className="text-xs text-text-light">— fotoğrafınız çerçevede böyle görünecek</span>
            </div>
            <ProductMockup
              templateUrl={item.mockupTemplateUrl}
              photoUrl={photos[0].preview}
              className="max-w-md mx-auto rounded-2xl shadow-xl"
            />
          </div>
        )}

        {/* Fotoğraf grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
            {photos.map((p, i) => {
              const q = getQuality(p.width, p.height);
              return (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-border group">
                  <img src={p.preview} alt={p.name} className="w-full h-full object-cover" />

                  {/* Optimizing spinner */}
                  {p.optimizing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Hover aksiyon katmanı */}
                  {!p.optimizing && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      {/* Kırp */}
                      <button
                        onClick={() => openCrop(i)}
                        className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                        title="Kırp"
                      >
                        <svg className="w-4 h-4 text-text" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      {/* Sil */}
                      <button
                        onClick={() => removePhoto(i)}
                        className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-red-50 transition-colors"
                        title="Sil"
                      >
                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Durum rozetleri */}
                  <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 pointer-events-none">
                    {p.optimized && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500 text-white leading-none">✓ Optimize</span>
                    )}
                    {p.cropped && !p.optimized && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-white leading-none">Kırpıldı</span>
                    )}
                    {q && !p.optimized && !p.cropped && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded leading-none ${q.cls}`}>{q.label}</span>
                    )}
                  </div>

                  {/* Boyut + sıra */}
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between pointer-events-none">
                    {p.width > 0 && (
                      <span className="text-[10px] font-semibold text-white bg-black/50 rounded px-1.5 py-0.5 leading-none">
                        {p.width}×{p.height}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-white bg-black/50 rounded px-1.5 py-0.5 leading-none ml-auto">
                      {i + 1}
                    </span>
                  </div>
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

        {/* Düşük kalite uyarısı */}
        {hasLowQuality && !allOptimized && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">Bazı fotoğraflar düşük çözünürlükte</p>
              <p className="text-xs text-amber-700 mt-0.5">Optimize ederek baskı kalitesini artırabilirsiniz.</p>
            </div>
          </div>
        )}

        {/* Büyük drop zone */}
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

        {/* Daha fazla ekle */}
        {photos.length > 0 && !done && (
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm font-semibold text-text-light hover:border-primary hover:text-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-4">
            {uploading
              ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Yükleniyor...</>
              : `+ Fotoğraf Ekle (${required - photos.length} kaldı)`}
          </button>
        )}

        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">{error}</p>
        )}

        {/* Optimize butonu */}
        {photos.length > 0 && !allOptimized && (
          <button onClick={optimizeAll} disabled={optimizingAll}
            className="w-full py-3 mb-3 border border-primary text-primary font-semibold rounded-full hover:bg-primary/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
            {optimizingAll ? (
              <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Optimize ediliyor...</>
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

        {/* Alt özet */}
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
            {added ? "✓ Sepete eklendi, yönlendiriliyorsunuz..." : done ? "Sepete Ekle →" : `${required - photos.length} fotoğraf daha ekleyin`}
          </button>
        </div>
      </div>

      {/* ── Kırp Modal (tam ekran) ──────────────────── */}
      {cropModal !== null && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#111]">

          {/* Üst bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/70 backdrop-blur border-b border-white/10 shrink-0">
            <button
              onClick={() => setCropModal(null)}
              className="text-sm text-white/60 hover:text-white transition-colors px-2 py-1"
            >
              İptal
            </button>

            {/* Oran seçici: Baskı oranı (kilitli) ↔ Serbest */}
            <div className="flex gap-1.5">
              {printRatio && (
                <button
                  onClick={() => setCropModal(s => {
                    if (!s) return s;
                    const photo = photos[s.photoIndex];
                    const aspect = photo.width >= photo.height ? printRatio.ratio : 1 / printRatio.ratio;
                    return { ...s, aspect, locked: true };
                  })}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    cropModal.locked
                      ? "bg-primary border-primary text-white"
                      : "border-white/20 text-white/60 hover:border-white/50 hover:text-white"
                  }`}
                >
                  Baskı {printRatio.label}
                </button>
              )}
              <button
                onClick={() => setCropModal(s => s ? { ...s, aspect: undefined, locked: false } : s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  !cropModal.locked
                    ? "bg-primary border-primary text-white"
                    : "border-white/20 text-white/60 hover:border-white/50 hover:text-white"
                }`}
              >
                Serbest
              </button>
            </div>

            <button
              onClick={applyCrop}
              disabled={croppingPhoto || !cropModal.croppedAreaPixels}
              className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors disabled:opacity-40 px-2 py-1"
            >
              {croppingPhoto ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  İşleniyor
                </span>
              ) : "Uygula"}
            </button>
          </div>

          {/* Crop alanı */}
          <div className="relative flex-1">
            <Cropper
              image={photos[cropModal.photoIndex].preview}
              crop={cropModal.crop}
              zoom={cropModal.zoom}
              aspect={cropModal.aspect}
              onCropChange={crop => setCropModal(s => s ? { ...s, crop } : s)}
              onZoomChange={zoom => setCropModal(s => s ? { ...s, zoom } : s)}
              onCropComplete={onCropComplete}
              style={{ containerStyle: { background: "#111" } }}
            />
          </div>

          {/* Kalite uyarısı — seçili kırpma alanı çözünürlüğü düşükse */}
          {cropModal.croppedAreaPixels && (() => {
            const q = getQuality(cropModal.croppedAreaPixels.width, cropModal.croppedAreaPixels.height);
            if (q && (q.label === "Düşük" || q.label === "Orta")) {
              return (
                <p className="text-xs text-amber-300 px-6 pt-3 text-center bg-black/70 shrink-0">
                  ⚠ Bu kırpma baskı kalitesini düşürebilir ({q.label} çözünürlük)
                </p>
              );
            }
            return null;
          })()}

          {/* Zoom slider */}
          <div className="flex items-center gap-3 px-6 py-4 bg-black/70 backdrop-blur border-t border-white/10 shrink-0">
            <svg className="w-4 h-4 text-white/50 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
            </svg>
            <input
              type="range" min={1} max={3} step={0.05}
              value={cropModal.zoom}
              onChange={e => setCropModal(s => s ? { ...s, zoom: Number(e.target.value) } : s)}
              className="flex-1 accent-primary h-1"
            />
            <svg className="w-4 h-4 text-white/50 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
            </svg>
            <span className="text-xs text-white/40 tabular-nums w-8 text-right">{cropModal.zoom.toFixed(1)}×</span>
          </div>
        </div>
      )}
    </>
  );
}
