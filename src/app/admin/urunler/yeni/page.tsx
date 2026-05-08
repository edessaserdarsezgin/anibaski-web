"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function YeniUrunPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      slug: form.get("slug"),
      description: form.get("description"),
      basePrice: Number(form.get("basePrice")),
      categorySlug: form.get("categorySlug"),
    };

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      setError("Ürün oluşturulurken hata oluştu.");
      setLoading(false);
      return;
    }

    router.push("/admin/urunler");
    router.refresh();
  }

  const inputCls = "px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors";

  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-3xl text-[var(--color-text)] mb-8">Yeni Ürün</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[var(--color-border)] p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-text)]">Ürün Adı</label>
          <input name="name" required className={inputCls} placeholder="Foto Kitap 20×20" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-text)]">Slug</label>
          <input name="slug" required className={inputCls} placeholder="foto-kitap-20x20" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-text)]">Kategori Slug</label>
          <input name="categorySlug" required className={inputCls} placeholder="albumler-ve-kitaplar" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-text)]">Fiyat (₺)</label>
          <input name="basePrice" type="number" min="0" step="0.01" required className={inputCls} placeholder="349" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-text)]">Açıklama</label>
          <textarea name="description" rows={3} className={`${inputCls} resize-none`} placeholder="Ürün açıklaması..." />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-2.5 border border-[var(--color-border)] text-sm font-semibold rounded-full hover:border-[var(--color-primary)] transition-colors">
            İptal
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors">
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
