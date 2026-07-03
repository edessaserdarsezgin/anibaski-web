"use client";

import { useState, useEffect } from "react";
import CustomSelect from "@/components/ui/CustomSelect";
import { useToast } from "@/components/ui/ToastProvider";

type SeoSettings = {
  siteName: string;
  defaultDescription: string;
  defaultOgImage: string;
  googleVerification: string;
  bingVerification: string;
};

type SeoPageRow = {
  path: string;
  label: string;
  defaultTitle: string;
  defaultDescription: string;
  title: string;
  description: string;
  ogImage: string;
};

const EMPTY_SETTINGS: SeoSettings = {
  siteName: "", defaultDescription: "", defaultOgImage: "",
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
  const [settings, setSettings] = useState<SeoSettings>(EMPTY_SETTINGS);
  const [pages, setPages] = useState<SeoPageRow[]>([]);
  const [selectedPath, setSelectedPath] = useState("/");
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPage, setSavingPage] = useState(false);
  const { toast } = useToast();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const siteUrlOk = !!siteUrl && !siteUrl.includes("localhost");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/seo-settings").then((r) => r.json()),
      fetch("/api/admin/seo-pages").then((r) => r.json()),
    ]).then(([s, p]) => {
      setSettings({ ...EMPTY_SETTINGS, ...s });
      setPages(p.pages ?? []);
      setLoading(false);
    });
  }, []);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    const res = await fetch("/api/admin/seo-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    toast(res.ok ? "Genel ayarlar kaydedildi." : "Kaydedilemedi.", res.ok ? undefined : "error");
    setSavingSettings(false);
  }

  const current = pages.find((p) => p.path === selectedPath);

  function updateCurrent(patch: Partial<SeoPageRow>) {
    setPages((prev) => prev.map((p) => (p.path === selectedPath ? { ...p, ...patch } : p)));
  }

  async function savePage() {
    if (!current) return;
    setSavingPage(true);
    const res = await fetch("/api/admin/seo-pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: current.path,
        title: current.title,
        description: current.description,
        ogImage: current.ogImage,
      }),
    });
    toast(res.ok ? `"${current.label}" kaydedildi.` : "Kaydedilemedi.", res.ok ? undefined : "error");
    setSavingPage(false);
  }

  if (loading) return <div className="text-text-light text-sm">Yükleniyor…</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl text-text mb-2">SEO Ayarları</h1>
      <p className="text-sm text-text-light mb-8">
        Sitenin Google aramalarında görünmesini ve düzgün indekslenmesini sağlayan ayarlar.
      </p>

      {/* 1. Genel Ayarlar */}
      <form onSubmit={saveSettings} className="flex flex-col gap-8 mb-10">
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-lg text-text mb-2">Google&apos;a Siteyi Tanıt</h2>
          <p className="text-xs text-text-light mb-4 leading-relaxed">
            Sitenizin Google aramalarında çıkması için Google&apos;ın siteyi tanıması gerekir.
            <br />1) <b>search.google.com/search-console</b> adresine gidin, sitenizi ekleyin.
            <br />2) &quot;HTML etiketi&quot; doğrulama yöntemini seçin, verilen kodu kopyalayın.
            <br />3) Kodu aşağıya yapıştırıp kaydedin, sonra Search Console&apos;da &quot;Doğrula&quot; deyin.
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text">Google doğrulama kodu</label>
              <input
                value={settings.googleVerification}
                onChange={(e) => setSettings((s) => ({ ...s, googleVerification: e.target.value }))}
                className={inputCls}
              />
              <p className="text-xs text-text-light">Yalnızca content=&quot;...&quot; içindeki kodu yapıştırın.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text">Bing doğrulama kodu (opsiyonel)</label>
              <input
                value={settings.bingVerification}
                onChange={(e) => setSettings((s) => ({ ...s, bingVerification: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-lg text-text mb-4">Genel Site Ayarları</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text">Site adı</label>
              <input
                value={settings.siteName}
                onChange={(e) => setSettings((s) => ({ ...s, siteName: e.target.value }))}
                className={inputCls}
              />
              <p className="text-xs text-text-light">Sayfa başlıklarının sonuna eklenir: Sayfa Adı | Site Adı</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text">Varsayılan açıklama</label>
              <textarea
                value={settings.defaultDescription}
                onChange={(e) => setSettings((s) => ({ ...s, defaultDescription: e.target.value }))}
                rows={3}
                className={inputCls}
              />
              <p className="text-xs text-text-light">Kendi açıklaması olmayan sayfalarda kullanılır.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text">Varsayılan paylaşım görseli (URL)</label>
              <input
                value={settings.defaultOgImage}
                onChange={(e) => setSettings((s) => ({ ...s, defaultOgImage: e.target.value }))}
                className={inputCls}
              />
              <p className="text-xs text-text-light">Sosyal medyada link paylaşılınca çıkan görsel. Boş bırakılabilir.</p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={savingSettings}
          className="py-3 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
        >
          {savingSettings ? "Kaydediliyor…" : "Genel ayarları kaydet"}
        </button>
      </form>

      {/* 2. Sayfa SEO */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-10">
        <h2 className="font-serif text-lg text-text mb-1">Sayfa SEO</h2>
        <p className="text-xs text-text-light mb-4">
          Bir sayfa seçin ve arama sonucundaki görünümünü ayarlayın. Boş bıraktığınız alanlar varsayılana düşer.
        </p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Sayfa</label>
            <CustomSelect
              value={selectedPath}
              onChange={(v) => setSelectedPath(v)}
              ariaLabel="Sayfa seç"
              className={inputCls}
              options={pages.map((p) => ({ value: p.path, label: p.label }))}
            />
          </div>

          {current && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text">Başlık</label>
                <input
                  value={current.title}
                  onChange={(e) => updateCurrent({ title: e.target.value })}
                  placeholder={current.defaultTitle}
                  className={inputCls}
                />
                <p className="text-xs text-text-light">Boşsa: &quot;{current.defaultTitle}&quot; · site adı otomatik eklenir.</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text">Açıklama</label>
                <textarea
                  value={current.description}
                  onChange={(e) => updateCurrent({ description: e.target.value })}
                  placeholder={current.defaultDescription}
                  rows={3}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text">Paylaşım görseli (URL)</label>
                <input
                  value={current.ogImage}
                  onChange={(e) => updateCurrent({ ogImage: e.target.value })}
                  className={inputCls}
                />
                <p className="text-xs text-text-light">Boşsa genel varsayılan görsel kullanılır.</p>
              </div>
              <button
                type="button"
                onClick={savePage}
                disabled={savingPage}
                className="py-3 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
              >
                {savingPage ? "Kaydediliyor…" : "Bu sayfayı kaydet"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. Durum kontrolü */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-serif text-lg text-text mb-4">Durum Kontrolü</h2>
        <div className="flex flex-col gap-2.5">
          <StatusRow ok={siteUrlOk} label="Site adresi ayarlı (NEXT_PUBLIC_SITE_URL)" />
          <StatusRow ok={!!settings.siteName} label="Site adı dolu" />
          <StatusRow ok={!!settings.defaultDescription} label="Varsayılan açıklama dolu" />
          <StatusRow ok={!!settings.googleVerification} label="Google doğrulama kodu girildi" />
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
    </div>
  );
}
