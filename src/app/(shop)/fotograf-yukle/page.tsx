"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Photo = { url: string; preview: string; name: string };
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

export default function FotografYuklePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [item, setItem] = useState<PendingItem | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
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

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const canAdd = required - photos.length;
    if (canAdd <= 0) return;

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    const MAX_SIZE_MB = 20;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    const validFiles: File[] = [];
    const validationErrors: string[] = [];

    for (const file of Array.from(files).slice(0, canAdd)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        validationErrors.push(`"${file.name}" desteklenmiyor. Yalnızca JPG, PNG, WEBP veya HEIC yükleyebilirsiniz.`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        validationErrors.push(`"${file.name}" çok büyük (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksimum boyut ${MAX_SIZE_MB} MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      if (validFiles.length === 0) return;
    } else {
      setError("");
    }

    setUploading(true);

    const results: Photo[] = [];
    for (const file of validFiles) {
      const preview = URL.createObjectURL(file);
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.status === 413) {
          setError(`"${file.name}" çok büyük, sunucu reddetti. Maksimum boyut 20 MB.`);
          continue;
        }
        let data: { url?: string; path?: string; error?: string } = {};
        try { data = await res.json(); } catch { /* HTML hata sayfası geldi */ }
        if (res.ok && data.url) {
          results.push({ url: data.url, preview, name: file.name });
        } else {
          setError(data.error ?? "Bir fotoğraf yüklenemedi, lütfen tekrar deneyin.");
        }
      } catch {
        setError("Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.");
      }
    }
    setPhotos(prev => [...prev, ...results]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
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

  const pct = Math.min(100, Math.round((photos.length / required) * 100));

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      {/* Üst bar */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/urunler`} className="text-sm text-text-light hover:text-primary transition-colors">
          ← Geri
        </Link>
        <div className="flex-1">
          <p className="text-xs text-text-light mb-1">{item.productName}</p>
          <div className="h-2 bg-bg rounded-full overflow-hidden border border-border">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className={`text-sm font-semibold tabular-nums min-w-[48px] text-right ${done ? "text-green-600" : "text-primary"}`}>
          {photos.length}/{required}
        </span>
      </div>

      <h1 className="font-serif text-2xl text-text mb-1">Fotoğraflarınızı Yükleyin</h1>
      <p className="text-sm text-text-light mb-8">
        {done
          ? "Tüm fotoğraflar hazır. Dilediğiniz zaman değiştirip silebilirsiniz."
          : `${required - photos.length} fotoğraf daha ekleyin`}
      </p>

      {/* Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
          {photos.map((p, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
              <img src={p.preview} alt={p.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
              >×</button>
              <span className="absolute bottom-1.5 left-1.5 text-xs font-bold text-white bg-black/50 rounded px-1.5 py-0.5 leading-none">
                {i + 1}
              </span>
            </div>
          ))}

          {/* Boş slotlar — max 4 göster */}
          {!done && Array.from({ length: Math.min(4, required - photos.length) }).map((_, i) => (
            <button key={`slot-${i}`} onClick={() => fileRef.current?.click()} disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center text-border hover:text-primary disabled:opacity-40">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Büyük drop zone — hiç fotoğraf yokken */}
      {photos.length === 0 && (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-video rounded-2xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-4 text-text-light hover:text-primary disabled:opacity-50 mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
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

      {/* Alt özet + sepet butonu */}
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
