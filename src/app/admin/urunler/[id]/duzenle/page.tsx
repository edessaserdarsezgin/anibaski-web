"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { isoToLocalInput, localInputToIso } from "@/lib/pricing";
import Image from "next/image";

type Category = { id: string; name: string; slug: string; parentId?: string | null };
type SavedVariant = { id: string; type: string; label: string; value: string; priceAddon: number };
type PendingOption = { label: string; priceAddon: number };
type Tag = { id: string; name: string; color: string };
type SelectedTag = { tagId: string; position: string };

const TR_MAP: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u",
};
function slugify(text: string) {
  return text.split("").map(c => TR_MAP[c] ?? c).join("")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function UrunDuzenle() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [extraCategoryIds, setExtraCategoryIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "", slug: "", basePrice: 0, categoryId: "", description: "",
    details: "",
    discountPercent: "", discountStartsAt: "", discountEndsAt: "",
    isFeatured: false,
  });
  const [requiresPhotoUpload, setRequiresPhotoUpload] = useState(false);
  const [photoCount, setPhotoCount] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [mockupTemplateUrl, setMockupTemplateUrl] = useState<string>("");
  const [mockupUploading, setMockupUploading] = useState(false);
  const mockupFileRef = useRef<HTMLInputElement>(null);

  const [variants, setVariants] = useState<SavedVariant[]>([]);
  const [pending, setPending] = useState<Record<string, PendingOption>>({});
  const [newGroupType, setNewGroupType] = useState("");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<SelectedTag[]>([]);
  const [tagSelect, setTagSelect] = useState("");
  const [tagPosition, setTagPosition] = useState("bottom-left");

  const fileRef = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);

  function reorderImages(to: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === to) return;
    setImages(prev => move(prev, from, to));
  }

  useEffect(() => {
    async function load() {
      const [productRes, catsRes, variantsRes, tagsRes, productTagsRes] = await Promise.all([
        fetch(`/api/admin/products/${id}`),
        fetch("/api/admin/categories"),
        fetch(`/api/admin/variants?productId=${id}`),
        fetch("/api/admin/tags"),
        fetch(`/api/admin/products/${id}/tags`),
      ]);
      const product = productRes.ok ? await productRes.json() : null;
      const cats = catsRes.ok ? await catsRes.json() : [];
      const savedVariants: SavedVariant[] = variantsRes.ok ? await variantsRes.json() : [];
      const tags: Tag[] = tagsRes.ok ? await tagsRes.json() : [];
      const productTags: SelectedTag[] = productTagsRes.ok ? (await productTagsRes.json()).map((pt: { tagId: string; position: string }) => ({ tagId: pt.tagId, position: pt.position })) : [];

      if (product) {
        const s = (product.specs as Record<string, string>) ?? {};
        setForm({
          name: product.name, slug: product.slug, basePrice: Number(product.basePrice),
          categoryId: product.categoryId, description: product.description ?? "",
          details: s.details ?? "",
          discountPercent: product.discount_percent != null ? String(product.discount_percent) : "",
          discountStartsAt: isoToLocalInput(product.discount_starts_at ?? null),
          discountEndsAt: isoToLocalInput(product.discount_ends_at ?? null),
          isFeatured: product.is_featured ?? false,
        });
        setImages(product.images ?? []);
        setRequiresPhotoUpload(!!product.requiresPhotoUpload);
        setPhotoCount(product.photoCount ?? 1);
        setMockupTemplateUrl(product.mockupTemplateUrl ?? "");
      }
      setVariants(savedVariants);
      const types = [...new Set(savedVariants.map(v => v.type))];
      setPending(Object.fromEntries(types.map(t => [t, { label: "", priceAddon: 0 }])));
      setCategories(Array.isArray(cats) ? cats : []);
      setAllTags(tags);
      setSelectedTags(productTags);
      const catRes = await fetch(`/api/admin/products/${id}/categories`);
      if (catRes.ok) setExtraCategoryIds(await catRes.json());
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleImageAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) setImages(prev => [...prev, data.url]);
    else setError("Görsel yüklenemedi.");
    setImageUploading(false);
    e.target.value = "";
  }

  function removeImage(url: string) {
    setImages(prev => prev.filter(u => u !== url));
  }

  async function handleMockupUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMockupUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) setMockupTemplateUrl(data.url);
    else setError("Mockup şablonu yüklenemedi.");
    setMockupUploading(false);
    e.target.value = "";
  }

  function addGroupLocally() {
    const type = newGroupType.trim();
    if (!type || pending[type] !== undefined) return;
    setPending(p => ({ ...p, [type]: { label: "", priceAddon: 0 } }));
    setNewGroupType("");
  }

  async function addOption(groupType: string) {
    const p = pending[groupType];
    if (!p?.label.trim()) return;

    const res = await fetch("/api/admin/variants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: id,
        type: groupType,
        label: p.label.trim(),
        value: slugify(p.label.trim()),
        priceAddon: p.priceAddon,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError("Seçenek eklenemedi: " + data.error); return; }
    setVariants(vs => [...vs, data]);
    setPending(p => ({ ...p, [groupType]: { label: "", priceAddon: 0 } }));
  }

  async function removeVariant(variantId: string) {
    const res = await fetch("/api/admin/variants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: variantId }),
    });
    if (!res.ok) { const d = await res.json(); setError("Silinemedi: " + d.error); return; }
    setVariants(vs => vs.filter(v => v.id !== variantId));
  }

  function handleOptionKey(e: KeyboardEvent<HTMLInputElement>, groupType: string) {
    if (e.key === "Enter") { e.preventDefault(); addOption(groupType); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, slug: form.slug, basePrice: form.basePrice, categoryId: form.categoryId, description: form.description, images, specs: form.details.trim() ? { details: form.details.trim() } : null, requiresPhotoUpload, photoCount: requiresPhotoUpload ? photoCount : 1, mockupTemplateUrl: mockupTemplateUrl || null, discount_percent: form.discountPercent || null, discount_starts_at: localInputToIso(form.discountStartsAt), discount_ends_at: localInputToIso(form.discountEndsAt), is_featured: form.isFeatured }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Güncellenemedi.");
      setSaving(false);
      return;
    }
    await fetch(`/api/admin/products/${id}/tags`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: selectedTags }),
    });
    await fetch(`/api/admin/products/${id}/categories`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryIds: extraCategoryIds }),
    });
    router.push("/admin/urunler");
    router.refresh();
  }

  const inputCls = "px-4 py-2.5 rounded-lg border border-border bg-bg text-sm outline-none focus:border-primary transition-colors";

  const groupTypes = [...new Set([
    ...variants.map(v => v.type),
    ...Object.keys(pending),
  ])];

  if (loading) return <div className="text-sm text-text-light p-8">Yükleniyor...</div>;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="text-sm text-text-light mb-1">
          <button onClick={() => router.back()} className="hover:text-primary">← Ürünler</button>
        </p>
        <h1 className="font-serif text-3xl text-text">Ürün Düzenle</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 flex flex-col gap-5">

        {/* Görseller */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text">Görseller</label>
          <div className="flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div key={url}
                draggable
                onDragStart={() => { dragIndex.current = i; }}
                onDragOver={e => e.preventDefault()}
                onDrop={() => reorderImages(i)}
                className="relative w-24 h-24 rounded-xl overflow-hidden border border-border cursor-move active:opacity-50">
                <Image src={url} alt="" fill className="object-cover pointer-events-none" sizes="96px" />
                <button type="button" onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={imageUploading}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-text-light hover:border-primary hover:text-primary transition-colors text-xs gap-1 disabled:opacity-50">
              <span className="text-2xl">+</span>
              <span>{imageUploading ? "Yükleniyor" : "Ekle"}</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageAdd} />
        </div>

        {/* Temel Bilgiler */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Ürün Adı</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Slug</label>
            <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))} required className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Fiyat (₺)</label>
            <input type="number" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: Number(e.target.value) }))} required className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">İndirim (%) — opsiyonel</label>
            <input type="number" min="0" max="100" value={form.discountPercent}
              onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
              className={inputCls} placeholder="örn. 20" />
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-light">Başlangıç</label>
                <input type="datetime-local" value={form.discountStartsAt}
                  onChange={e => setForm(f => ({ ...f, discountStartsAt: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-light">Bitiş</label>
                <input type="datetime-local" value={form.discountEndsAt}
                  onChange={e => setForm(f => ({ ...f, discountEndsAt: e.target.value }))} className={inputCls} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Kategori</label>
            <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} required className={inputCls}>
              <option value="">Kategori seçin</option>
              {categories.filter(c => !c.parentId).map(parent => {
                const children = categories.filter(c => c.parentId === parent.id);
                return children.length > 0 ? (
                  <optgroup key={parent.id} label={parent.name}>
                    <option value={parent.id}>{parent.name} (tümü)</option>
                    {children.map(c => <option key={c.id} value={c.id}>↳ {c.name}</option>)}
                  </optgroup>
                ) : (
                  <option key={parent.id} value={parent.id}>{parent.name}</option>
                );
              })}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-sm font-semibold text-text">Ek Kategoriler (opsiyonel)</label>
            <p className="text-xs text-text-light">Ürün, birincil kategorisinin yanı sıra seçtiğin kategorilerde de listelenir.</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {categories.filter(c => c.id !== form.categoryId).map((c) => {
                const on = extraCategoryIds.includes(c.id);
                return (
                  <button type="button" key={c.id}
                    onClick={() => setExtraCategoryIds(s => on ? s.filter(x => x !== c.id) : [...s, c.id])}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${on ? "border-primary bg-primary text-white" : "border-border text-text hover:border-primary"}`}>
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-text">
              <input type="checkbox" checked={form.isFeatured}
                onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                className="w-4 h-4 accent-primary" />
              Ana sayfada öne çıkar
            </label>
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-sm font-semibold text-text">Açıklama</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Ürün Detayları */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">
            Ürün Detayları
            <span className="ml-1.5 text-xs font-normal text-text-light">(opsiyonel — her satır ayrı madde olarak görünür)</span>
          </label>
          <textarea
            value={form.details}
            onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
            rows={5}
            placeholder={"Kağıt: 250gr Kuşe\nBaskı Tekniği: UV Ofset\nÜretim Süresi: 2-3 iş günü\nBoyutlar: 10×15 cm"}
            className={`${inputCls} resize-none`}
          />
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

        {/* Mockup Şablonu */}
        <div className="flex flex-col gap-3 pt-2 border-t border-border">
          <div>
            <p className="text-sm font-semibold text-text">Ürün Mockup Şablonu</p>
            <p className="text-xs text-text-light mt-0.5">Şeffaf delikli PNG — müşterinin fotoğrafı bu şablonun arkasında gösterilir</p>
          </div>
          {mockupTemplateUrl ? (
            <div className="flex items-start gap-4">
              <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-border bg-[#ccc] bg-[repeating-conic-gradient(#aaa_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
                <Image src={mockupTemplateUrl} alt="Mockup şablonu" fill className="object-contain" sizes="128px" />
              </div>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => mockupFileRef.current?.click()} disabled={mockupUploading}
                  className="px-4 py-2 border border-border text-sm font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
                  {mockupUploading ? "Yükleniyor..." : "Değiştir"}
                </button>
                <button type="button" onClick={() => setMockupTemplateUrl("")}
                  className="px-4 py-2 border border-red-200 text-red-500 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors">
                  Kaldır
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => mockupFileRef.current?.click()} disabled={mockupUploading}
              className="w-32 h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-text-light hover:border-primary hover:text-primary transition-colors text-xs gap-1 disabled:opacity-50">
              <span className="text-2xl">+</span>
              <span>{mockupUploading ? "Yükleniyor" : "Şablon Ekle"}</span>
            </button>
          )}
          <input ref={mockupFileRef} type="file" accept="image/png,image/webp" className="hidden" onChange={handleMockupUpload} />
        </div>

        {/* Varyantlar */}
        <div className="flex flex-col gap-4 pt-2 border-t border-border">
          <p className="text-sm font-semibold text-text">Varyantlar / Özellikler</p>
          <p className="text-xs text-text-light">Seçenekler anında kaydedilir.</p>

          {groupTypes.map(groupType => {
            const groupVariants = variants.filter(v => v.type === groupType);
            return (
              <div key={groupType} className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-bg border-b border-border">
                  <span className="text-sm font-semibold text-text capitalize">{groupType}</span>
                  <span className="text-xs text-text-light">{groupVariants.length} seçenek</span>
                </div>

                {groupVariants.length > 0 && (
                  <div className="divide-y divide-border">
                    {groupVariants.map(v => (
                      <div key={v.id} className="flex items-center justify-between px-4 py-2 text-sm">
                        <span className="text-text">{v.label}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-primary">
                            {Number(v.priceAddon) > 0 ? `+${Number(v.priceAddon)} ₺` : "—"}
                          </span>
                          <button type="button" onClick={() => removeVariant(v.id)}
                            className="text-red-400 hover:text-red-600 text-xs font-semibold">
                            Sil
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 p-3 bg-white">
                  <input
                    value={pending[groupType]?.label ?? ""}
                    onChange={e => setPending(p => ({ ...p, [groupType]: { ...p[groupType], label: e.target.value } }))}
                    onKeyDown={e => handleOptionKey(e, groupType)}
                    className={inputCls + " flex-1"}
                    placeholder="Seçenek adı"
                  />
                  <input
                    type="number" min="0" step="0.01"
                    value={pending[groupType]?.priceAddon ?? 0}
                    onChange={e => setPending(p => ({ ...p, [groupType]: { ...p[groupType], priceAddon: Number(e.target.value) } }))}
                    onKeyDown={e => handleOptionKey(e, groupType)}
                    className={inputCls + " w-28"}
                    placeholder="Ek fiyat ₺"
                  />
                  <button type="button" onClick={() => addOption(groupType)}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition-colors">
                    +
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex gap-2">
            <input
              value={newGroupType}
              onChange={e => setNewGroupType(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addGroupLocally(); } }}
              className={inputCls + " flex-1"}
              placeholder="Yeni varyant tipi (ör: Kağıt Türü, Boyut)"
            />
            <button type="button" onClick={addGroupLocally}
              className="px-5 py-2 border border-border text-sm font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors">
              + Tip Ekle
            </button>
          </div>
        </div>

        {/* Etiketler */}
        <div className="flex flex-col gap-3 pt-2 border-t border-border">
          <p className="text-sm font-semibold text-text">Etiketler</p>
          {selectedTags.length > 0 && (
            <div className="flex flex-col gap-2">
              {selectedTags.map(st => {
                const tag = allTags.find(t => t.id === st.tagId);
                if (!tag) return null;
                return (
                  <div key={st.tagId} className="flex items-center gap-2">
                    <span className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                      style={{ backgroundColor: tag.color }}>
                      {tag.name}
                    </span>
                    <select
                      value={st.position}
                      onChange={e => setSelectedTags(s => s.map(x => x.tagId === st.tagId ? { ...x, position: e.target.value } : x))}
                      className={inputCls + " w-32 text-xs py-1.5"}
                    >
                      <option value="top-left">Sol Üst</option>
                      <option value="bottom-left">Sol Alt</option>
                      <option value="bottom-right">Sağ Alt</option>
                    </select>
                    <button type="button"
                      onClick={() => setSelectedTags(s => s.filter(x => x.tagId !== st.tagId))}
                      className="text-red-400 hover:text-red-600 text-xs font-semibold px-2">
                      Kaldır
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {allTags.length > 0 && (
            <div className="flex gap-2 items-center flex-wrap">
              <select
                value={tagSelect}
                onChange={e => setTagSelect(e.target.value)}
                className={inputCls + " flex-1 min-w-32"}
              >
                <option value="">Etiket seç</option>
                {allTags.map(t => (
                  <option key={t.id} value={t.id} disabled={selectedTags.some(s => s.tagId === t.id)}>
                    {t.name}
                  </option>
                ))}
              </select>
              <select
                value={tagPosition}
                onChange={e => setTagPosition(e.target.value)}
                className={inputCls + " w-36"}
              >
                <option value="top-left">Sol Üst</option>
                <option value="bottom-left">Sol Alt</option>
                <option value="bottom-right">Sağ Alt</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!tagSelect || selectedTags.some(s => s.tagId === tagSelect)) return;
                  setSelectedTags(s => [...s, { tagId: tagSelect, position: tagPosition }]);
                  setTagSelect("");
                }}
                className="px-4 py-2 border border-border text-sm font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors"
              >
                + Ekle
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-2.5 border border-border text-sm font-semibold rounded-full hover:border-primary transition-colors">
            İptal
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors">
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
