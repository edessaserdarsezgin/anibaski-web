"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, KeyboardEvent } from "react";

type Category = { id: string; name: string; slug: string };
type VariantOption = { label: string; priceAddon: number };
type VariantGroup = { type: string; options: VariantOption[] };

const TR_MAP: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u",
};
function slugify(text: string) {
  return text.split("").map(c => TR_MAP[c] ?? c).join("")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function YeniUrunPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [productName, setProductName] = useState("");
  const [productSlug, setProductSlug] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  // Gruplu varyant state
  const [requiresPhotoUpload, setRequiresPhotoUpload] = useState(false);
  const [photoCount, setPhotoCount] = useState(1);
  const [groups, setGroups] = useState<VariantGroup[]>([]);
  const [newGroupType, setNewGroupType] = useState("");
  // Her grup için bekleyen seçenek inputları
  const [pending, setPending] = useState<Record<string, { label: string; priceAddon: number }>>({});

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []));
  }, []);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setImageUploading(true);
    for (const file of files) {
      const preview = URL.createObjectURL(file);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError("Görsel yüklenemedi."); continue; }
      setImageUrls(prev => [...prev, data.url]);
      setImagePreviews(prev => [...prev, preview]);
    }
    setImageUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function addGroup() {
    const type = newGroupType.trim();
    if (!type || groups.some(g => g.type === type)) return;
    setGroups(gs => [...gs, { type, options: [] }]);
    setPending(p => ({ ...p, [type]: { label: "", priceAddon: 0 } }));
    setNewGroupType("");
  }

  function removeGroup(type: string) {
    setGroups(gs => gs.filter(g => g.type !== type));
    setPending(p => { const next = { ...p }; delete next[type]; return next; });
  }

  function addOption(groupType: string) {
    const p = pending[groupType];
    if (!p?.label.trim()) return;
    setGroups(gs => gs.map(g =>
      g.type === groupType
        ? { ...g, options: [...g.options, { label: p.label.trim(), priceAddon: p.priceAddon }] }
        : g
    ));
    setPending(p => ({ ...p, [groupType]: { label: "", priceAddon: 0 } }));
  }

  function removeOption(groupType: string, idx: number) {
    setGroups(gs => gs.map(g =>
      g.type === groupType ? { ...g, options: g.options.filter((_, i) => i !== idx) } : g
    ));
  }

  function handleOptionKey(e: KeyboardEvent<HTMLInputElement>, groupType: string) {
    if (e.key === "Enter") { e.preventDefault(); addOption(groupType); }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    // Pending inputları da dahil et
    const finalGroups = groups.map(g => {
      const p = pending[g.type];
      const extra = p?.label.trim() ? [{ label: p.label.trim(), priceAddon: p.priceAddon }] : [];
      return { ...g, options: [...g.options, ...extra] };
    });

    const variants = finalGroups.flatMap(g =>
      g.options.map(o => ({ type: g.type, label: o.label, value: slugify(o.label), priceAddon: o.priceAddon }))
    );

    const body = {
      name: productName,
      slug: productSlug,
      description: form.get("description"),
      basePrice: Number(form.get("basePrice")),
      categorySlug: form.get("categorySlug"),
      imageUrls,
      variants,
      requiresPhotoUpload,
      photoCount: requiresPhotoUpload ? photoCount : 1,
    };

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Ürün oluşturulurken hata oluştu.");
      setLoading(false);
      return;
    }

    router.push("/admin/urunler");
    router.refresh();
  }

  const inputCls = "px-4 py-2.5 rounded-lg border border-border bg-bg text-sm outline-none focus:border-primary transition-colors";

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl text-text mb-8">Yeni Ürün</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 flex flex-col gap-4">

        {/* Görseller */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text">Görseller</label>
          <div className="grid grid-cols-4 gap-2">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                <img src={src} alt={`Görsel ${i + 1}`} className="w-full h-full object-cover" />
                <button type="button"
                  onClick={() => { setImagePreviews(p => p.filter((_, idx) => idx !== i)); setImageUrls(p => p.filter((_, idx) => idx !== i)); }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500">
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={imageUploading}
              className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-1 text-text-light hover:text-primary disabled:opacity-50 text-xs">
              {imageUploading ? "..." : <><span className="text-xl leading-none">+</span><span>Ekle</span></>}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
          {imageUrls.length > 0 && !imageUploading && (
            <p className="text-xs text-green-600">✓ {imageUrls.length} görsel yüklendi</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Ürün Adı</label>
          <input
            value={productName}
            onChange={e => { setProductName(e.target.value); setProductSlug(slugify(e.target.value)); }}
            required className={inputCls} placeholder="Foto Kitap 20×20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Slug</label>
          <input
            value={productSlug}
            onChange={e => setProductSlug(slugify(e.target.value))}
            required className={inputCls} placeholder="foto-kitap-20x20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Kategori</label>
          <select name="categorySlug" required className={inputCls}>
            <option value="">Kategori seçin</option>
            {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Fiyat (₺)</label>
          <input name="basePrice" type="number" min="0" step="0.01" required className={inputCls} placeholder="349" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Açıklama</label>
          <textarea name="description" rows={3} className={`${inputCls} resize-none`} placeholder="Ürün açıklaması..." />
        </div>

        {/* Fotoğraf Yükleme */}
        <div className="flex flex-col gap-3 pt-2 border-t border-border">
          <p className="text-sm font-semibold text-text">Fotoğraf Yükleme</p>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={requiresPhotoUpload}
              onChange={e => setRequiresPhotoUpload(e.target.checked)}
              className="w-4 h-4 accent-primary" />
            <span className="text-sm text-text">Bu ürün müşteriden fotoğraf istiyor</span>
          </label>
          {requiresPhotoUpload && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text">Gereken fotoğraf sayısı</label>
              <input
                type="number" min={1} max={200}
                value={photoCount}
                onChange={e => setPhotoCount(Number(e.target.value))}
                className={inputCls + " w-32"}
              />
            </div>
          )}
        </div>

        {/* Varyantlar */}
        <div className="flex flex-col gap-4 pt-2 border-t border-border">
          <p className="text-sm font-semibold text-text">Varyantlar / Özellikler</p>

          {groups.map(group => (
            <div key={group.type} className="rounded-xl border border-border overflow-hidden">
              {/* Grup başlığı */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-bg border-b border-border">
                <span className="text-sm font-semibold text-text capitalize">{group.type}</span>
                <button type="button" onClick={() => removeGroup(group.type)}
                  className="text-xs text-red-400 hover:text-red-600 font-semibold">
                  Grubu Sil
                </button>
              </div>

              {/* Mevcut seçenekler */}
              {group.options.length > 0 && (
                <div className="divide-y divide-border">
                  {group.options.map((opt, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                      <span className="text-text">{opt.label}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-primary">
                          {opt.priceAddon > 0 ? `+${opt.priceAddon} ₺` : "—"}
                        </span>
                        <button type="button" onClick={() => removeOption(group.type, i)}
                          className="text-red-400 hover:text-red-600 text-xs font-semibold">
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Yeni seçenek inputu */}
              <div className="flex gap-2 p-3 bg-white">
                <input
                  value={pending[group.type]?.label ?? ""}
                  onChange={e => setPending(p => ({ ...p, [group.type]: { ...p[group.type], label: e.target.value } }))}
                  onKeyDown={e => handleOptionKey(e, group.type)}
                  className={inputCls + " flex-1"}
                  placeholder="Seçenek adı (ör: Mat)"
                />
                <input
                  type="number" min="0" step="0.01"
                  value={pending[group.type]?.priceAddon ?? 0}
                  onChange={e => setPending(p => ({ ...p, [group.type]: { ...p[group.type], priceAddon: Number(e.target.value) } }))}
                  onKeyDown={e => handleOptionKey(e, group.type)}
                  className={inputCls + " w-28"}
                  placeholder="Ek fiyat ₺"
                />
                <button
                  type="button"
                  onClick={() => addOption(group.type)}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          ))}

          {/* Yeni grup ekle */}
          <div className="flex gap-2">
            <input
              value={newGroupType}
              onChange={e => setNewGroupType(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addGroup(); } }}
              className={inputCls + " flex-1"}
              placeholder="Varyant tipi (ör: Kağıt Türü, Boyut)"
            />
            <button
              type="button"
              onClick={addGroup}
              className="px-5 py-2 border border-border text-sm font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors"
            >
              + Tip Ekle
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-2.5 border border-border text-sm font-semibold rounded-full hover:border-primary transition-colors">
            İptal
          </button>
          <button type="submit" disabled={loading || imageUploading}
            className="flex-1 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors">
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
