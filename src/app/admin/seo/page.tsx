"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/ToastProvider";

type SeoSettings = {
  defaultTitle: string;
  siteName: string;
  description: string;
  ogImage: string;
  googleVerification: string;
  bingVerification: string;
};

const EMPTY: SeoSettings = {
  defaultTitle: "", siteName: "", description: "", ogImage: "",
  googleVerification: "", bingVerification: "",
};

const inputCls =
  "px-4 py-2.5 rounded-lg border border-border bg-bg text-sm text-text outline-none focus:border-primary transition-colors w-full";

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={ok ? "text-green-600" : "text-red-500"}>{ok ? "✓" : "✕"}</span>
      <span className="text-text">{label}</span>
    </div>
  );
}

export default function SeoPage() {
  const [form, setForm] = useState<SeoSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  useEffect(() => {
    fetch("/api/admin/seo-settings")
      .then((r) => r.json())
      .then((data) => { setForm({ ...EMPTY, ...data }); setLoading(false); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/seo-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) toast("SEO ayarları kaydedildi.");
    else toast("Kaydedilemedi.", "error");
    setSaving(false);
  }

  function field(key: keyof SeoSettings, label: string, hint?: string, textarea?: boolean) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-text">{label}</label>
        {textarea ? (
          <textarea
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            rows={3}
            className={inputCls}
          />
        ) : (
          <input
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            className={inputCls}
          />
        )}
        {hint && <p className="text-xs text-text-light">{hint}</p>}
      </div>
    );
  }

  if (loading) return <div className="text-text-light text-sm">Yükleniyor…</div>;

  const siteUrlOk = !!siteUrl && !siteUrl.includes("localhost");

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl text-text mb-2">SEO Ayarları</h1>
      <p className="text-sm text-text-light mb-8">
        Sitenin Google aramalarında görünmesini ve düzgün indekslenmesini sağlayan ayarlar.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* 1. Google'a siteyi tanıt */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-lg text-text mb-2">Google&apos;a Siteyi Tanıt</h2>
          <p className="text-xs text-text-light mb-4 leading-relaxed">
            Sitenizin Google aramalarında çıkması için Google&apos;ın siteyi tanıması gerekir.
            <br />1) <b>search.google.com/search-console</b> adresine gidin, sitenizi ekleyin.
            <br />2) &quot;HTML etiketi&quot; doğrulama yöntemini seçin, verilen kodu kopyalayın.
            <br />3) Kodu aşağıya yapıştırıp kaydedin, sonra Search Console&apos;da &quot;Doğrula&quot; deyin.
          </p>
          <div className="flex flex-col gap-4">
            {field("googleVerification", "Google doğrulama kodu", "Yalnızca content=\"...\" içindeki kodu yapıştırın.")}
            {field("bingVerification", "Bing doğrulama kodu (opsiyonel)", "Bing Webmaster Tools kullanıyorsanız.")}
          </div>
        </div>

        {/* 2. Arama sonucu görünümü */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-lg text-text mb-4">Arama Sonucu Görünümü</h2>
          <div className="flex flex-col gap-4">
            {field("defaultTitle", "Site başlığı", "Google'da çıkan mavi başlık (ana sayfa).")}
            {field("siteName", "Site adı", "Sayfa başlıklarının sonuna eklenir: Ürün Adı | Site Adı")}
            {field("description", "Site açıklaması", "Arama sonucunda başlığın altındaki gri açıklama yazısı.", true)}
            {field("ogImage", "Paylaşım görseli (URL)", "Sosyal medyada link paylaşılınca çıkan görsel. Boş bırakılabilir.")}
          </div>
        </div>

        {/* 3. Durum kontrolü */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-lg text-text mb-4">Durum Kontrolü</h2>
          <div className="flex flex-col gap-2.5">
            <StatusRow ok={siteUrlOk} label="Site adresi ayarlı (NEXT_PUBLIC_SITE_URL)" />
            <StatusRow ok={!!form.defaultTitle} label="Site başlığı dolu" />
            <StatusRow ok={!!form.description} label="Site açıklaması dolu" />
            <StatusRow ok={!!form.googleVerification} label="Google doğrulama kodu girildi" />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600">✓</span>
              <a href="/sitemap.xml" target="_blank" rel="noopener" className="text-primary underline">Site haritası (sitemap.xml)</a>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600">✓</span>
              <a href="/robots.txt" target="_blank" rel="noopener" className="text-primary underline">Arama motoru kuralları (robots.txt)</a>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="py-3 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
