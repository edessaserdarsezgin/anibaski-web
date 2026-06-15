"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Category = { id: string; name: string; slug: string };
type Product = { id: string; name: string; slug: string };
type Coupon = { id: string; code: string };

type Props = {
  initial?: {
    id?: string;
    title: string;
    slug: string;
    subtitle: string;
    description: string;
    image_url: string;
    cta_text: string;
    cta_url: string;
    coupon_code: string;
    starts_at: string;
    ends_at: string;
    position: number;
    placement: string;
  };
  categories: Category[];
  products: Product[];
  coupons: Coupon[];
};

const DEFAULT = {
  title: "",
  slug: "",
  subtitle: "",
  description: "",
  image_url: "",
  cta_text: "İncele",
  cta_url: "",
  coupon_code: "",
  starts_at: "",
  ends_at: "",
  position: 0,
  placement: "hero",
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ç/g, "c")
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function CampaignForm({ initial, categories, products, coupons }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ ...DEFAULT, ...(initial ?? {}) });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputCls = "px-4 py-2.5 rounded-lg border border-border bg-bg text-sm outline-none focus:border-primary transition-colors w-full";

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "campaigns");

    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Görsel yüklenemedi.");
      return;
    }
    const { url } = await res.json();
    setForm((f) => ({ ...f, image_url: url }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.image_url) { setError("Görsel zorunlu."); return; }
    if (!form.cta_url) { setError("Yönlendirme URL'i zorunlu."); return; }

    setSaving(true);
    setError("");

    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      coupon_code: form.coupon_code || null,
      subtitle: form.subtitle || null,
      description: form.description || null,
      placement: form.placement === "card" ? "card" : "hero",
    };

    const url = initial?.id ? `/api/admin/campaigns/${initial.id}` : "/api/admin/campaigns";
    const method = initial?.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Kaydedilemedi.");
      return;
    }
    router.push("/admin/kampanyalar");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-3xl">
      {/* Yerleşim */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-text">Yerleşim</label>
        <select
          value={form.placement}
          onChange={(e) => setForm({ ...form, placement: e.target.value })}
          className={inputCls + " cursor-pointer"}
        >
          <option value="hero">Hero Banner (üst slider)</option>
          <option value="card">Kampanya Kartı (ana sayfa ızgara)</option>
        </select>
        <p className="text-xs text-text-light">
          Hero: sayfanın üstündeki büyük slider. Kart: ana sayfadaki görselli kampanya ızgarası.
        </p>
      </div>

      {/* Görsel */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-text">Görsel <span className="text-red-500">*</span></label>
        {form.image_url && (
          <div className="relative w-full h-48 rounded-xl border border-border overflow-hidden bg-bg">
            <Image src={form.image_url} alt="" fill className="object-cover" sizes="800px" />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
          className="text-sm"
        />
        {uploading && <p className="text-xs text-text-light">Yükleniyor...</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Başlık <span className="text-red-500">*</span></label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })}
            className={inputCls}
            placeholder="Yaz Kampanyası"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className={inputCls + " font-mono"}
            placeholder="yaz-kampanyasi"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-text">Alt Başlık</label>
        <input
          value={form.subtitle}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          className={inputCls}
          placeholder="Tüm baskılarda %20 indirim"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-text">Açıklama</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={inputCls + " min-h-24 resize-y"}
          placeholder="Kampanya detayları..."
        />
      </div>

      {/* Yönlendirme — kategori / ürün / kupon seçici */}
      <div className="bg-bg border border-border rounded-xl p-4 flex flex-col gap-3">
        <p className="text-sm font-semibold text-text">Yönlendirme</p>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-light">CTA URL <span className="text-red-500">*</span></label>
          <input
            required
            value={form.cta_url}
            onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
            className={inputCls}
            placeholder="/urunler veya /kategoriler/fotograf-baskilari"
          />
          <div className="flex flex-wrap gap-1.5 mt-1">
            <button type="button" onClick={() => setForm({ ...form, cta_url: "/urunler" })}
              className="px-2 py-0.5 text-xs rounded-full border border-border text-text-light hover:border-primary hover:text-primary">
              Tüm Ürünler
            </button>
            {categories.slice(0, 6).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setForm({ ...form, cta_url: `/kategoriler/${c.slug}` })}
                className="px-2 py-0.5 text-xs rounded-full border border-border text-text-light hover:border-primary hover:text-primary"
              >
                {c.name}
              </button>
            ))}
          </div>
          <select
            value=""
            onChange={(e) => e.target.value && setForm({ ...form, cta_url: `/urunler/${e.target.value}` })}
            className={inputCls + " cursor-pointer mt-1"}
          >
            <option value="">Belirli bir ürün seç (opsiyonel)…</option>
            {products.map((p) => (
              <option key={p.id} value={p.slug}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-light">CTA Butonu Metni</label>
            <input
              value={form.cta_text}
              onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
              className={inputCls}
              placeholder="İncele"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-light">Kupon Kodu (opsiyonel)</label>
            <select
              value={form.coupon_code}
              onChange={(e) => setForm({ ...form, coupon_code: e.target.value })}
              className={inputCls + " cursor-pointer font-mono"}
            >
              <option value="">— Yok —</option>
              {coupons.map((c) => (
                <option key={c.id} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Başlangıç</label>
          <input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Bitiş</label>
          <input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Sıra</label>
          <input
            type="number"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
            className={inputCls}
            min={0}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || uploading}
          className="px-8 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
        >
          {saving ? "Kaydediliyor..." : initial?.id ? "Güncelle" : "Kaydet"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/kampanyalar")}
          className="px-6 py-2.5 border border-border text-text text-sm font-semibold rounded-full hover:bg-bg transition-colors"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
