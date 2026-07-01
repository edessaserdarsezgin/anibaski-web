"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { SECTION_LABELS, type MakbuzConfig, type DocSectionKey } from "@/lib/documents";

export default function BelgeAyarlariPage() {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<MakbuzConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragKey, setDragKey] = useState<DocSectionKey | null>(null);

  useEffect(() => {
    fetch("/api/admin/document-settings").then(r => r.json()).then(setCfg);
  }, []);

  function patch(p: Partial<MakbuzConfig>) {
    setCfg(c => (c ? { ...c, ...p } : c));
  }

  async function save() {
    if (!cfg) return;
    setSaving(true);
    const res = await fetch("/api/admin/document-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    toast(res.ok ? "Belge ayarları kaydedildi" : "Kaydedilemedi", res.ok ? "success" : "error");
    setSaving(false);
  }

  async function uploadLogo(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (res.ok) { const d = await res.json(); patch({ logoUrl: d.url }); }
    else toast("Logo yüklenemedi", "error");
    setUploading(false);
  }

  // Bölüm sürükle-sırala
  function onDropSection(target: DocSectionKey) {
    if (!cfg || !dragKey || dragKey === target) { setDragKey(null); return; }
    const arr = [...cfg.sections];
    const from = arr.findIndex(s => s.key === dragKey);
    const to = arr.findIndex(s => s.key === target);
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    patch({ sections: arr });
    setDragKey(null);
  }
  function toggleSection(key: DocSectionKey) {
    if (!cfg) return;
    patch({ sections: cfg.sections.map(s => s.key === key ? { ...s, enabled: !s.enabled } : s) });
  }

  // Süreç adımları
  function setStep(i: number, v: string) {
    if (!cfg) return;
    patch({ processSteps: cfg.processSteps.map((s, j) => j === i ? v : s) });
  }
  function moveStep(i: number, dir: -1 | 1) {
    if (!cfg) return;
    const arr = [...cfg.processSteps];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    patch({ processSteps: arr });
  }
  function removeStep(i: number) {
    if (!cfg) return;
    patch({ processSteps: cfg.processSteps.filter((_, j) => j !== i) });
  }
  function addStep() {
    if (!cfg) return;
    patch({ processSteps: [...cfg.processSteps, "Yeni adım"] });
  }

  const inputCls = "px-3 py-2 rounded-lg border border-border bg-bg text-sm outline-none focus:border-primary transition-colors";

  if (!cfg) return <p className="text-sm text-text-light">Yükleniyor...</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-3xl text-text">Belge Ayarları</h1>
        <button onClick={save} disabled={saving} className="px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors">
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
      <p className="text-sm text-text-light mb-8">İş Makbuzu — hangi bölümler görünsün, hangi sırada, metinler ve logo. Değişiklik kod gerektirmez.</p>

      <div className="flex flex-col gap-6">
        {/* Başlık + logo + alt not */}
        <section className="bg-white rounded-2xl border border-border p-6 flex flex-col gap-4">
          <h2 className="font-serif text-lg text-text">Başlık & Logo</h2>
          <label className="text-sm text-text flex flex-col gap-1">
            Başlık metni
            <input value={cfg.headerTitle} onChange={e => patch({ headerTitle: e.target.value })} className={inputCls} />
          </label>
          <div className="flex items-center gap-3">
            {cfg.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cfg.logoUrl} alt="" className="w-14 h-14 rounded-lg object-contain border border-border" />
            ) : (
              <div className="w-14 h-14 rounded-lg border border-dashed border-border flex items-center justify-center text-[10px] text-text-light text-center">Logo yok</div>
            )}
            <label className="text-sm text-primary font-semibold cursor-pointer hover:underline">
              {uploading ? "Yükleniyor..." : cfg.logoUrl ? "Logo değiştir" : "Logo yükle"}
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = ""; }} />
            </label>
            {cfg.logoUrl && <button onClick={() => patch({ logoUrl: null })} className="text-xs text-red-500 hover:underline">Kaldır</button>}
          </div>
          <label className="text-sm text-text flex flex-col gap-1">
            Alt not (footer)
            <input value={cfg.footerText} onChange={e => patch({ footerText: e.target.value })} placeholder="Opsiyonel — makbuzun altında görünür" className={inputCls} />
          </label>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" checked={cfg.showQr} onChange={e => patch({ showQr: e.target.checked })} className="w-4 h-4 accent-primary" /> QR kod göster
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" checked={cfg.showPhotos} onChange={e => patch({ showPhotos: e.target.checked })} className="w-4 h-4 accent-primary" /> Ürün fotoğrafları göster
            </label>
          </div>
        </section>

        {/* Bölümler — sürükle-sırala + aç/kapa */}
        <section className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-lg text-text mb-1">Bölümler</h2>
          <p className="text-xs text-text-light mb-4">⠿ tutamağından sürükleyerek sırala · kutu ile göster/gizle</p>
          <ul className="flex flex-col gap-2">
            {cfg.sections.map((s) => (
              <li
                key={s.key}
                draggable
                onDragStart={() => setDragKey(s.key)}
                onDragOver={e => { if (dragKey && dragKey !== s.key) e.preventDefault(); }}
                onDrop={() => onDropSection(s.key)}
                onDragEnd={() => setDragKey(null)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-bg ${dragKey === s.key ? "opacity-40" : ""}`}
              >
                <span className="cursor-grab active:cursor-grabbing text-text-light/50 select-none" aria-hidden>⠿</span>
                <label className="flex items-center gap-2 flex-1 text-sm text-text">
                  <input type="checkbox" checked={s.enabled} onChange={() => toggleSection(s.key)} className="w-4 h-4 accent-primary" />
                  {SECTION_LABELS[s.key]}
                </label>
              </li>
            ))}
          </ul>
        </section>

        {/* Süreç adımları */}
        <section className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-lg text-text">Süreç Takip Adımları</h2>
              <p className="text-xs text-text-light mt-1">Makbuzda elle işaretlenen kutucuklar</p>
            </div>
            <button onClick={addStep} className="text-sm text-primary font-semibold hover:underline">+ Adım ekle</button>
          </div>
          <ul className="flex flex-col gap-2">
            {cfg.processSteps.map((step, i) => (
              <li key={i} className="flex items-center gap-2">
                <input value={step} onChange={e => setStep(i, e.target.value)} className={inputCls + " flex-1"} />
                <button onClick={() => moveStep(i, -1)} disabled={i === 0} className="px-2 py-1 text-text-light disabled:opacity-30 hover:text-text" aria-label="Yukarı">↑</button>
                <button onClick={() => moveStep(i, 1)} disabled={i === cfg.processSteps.length - 1} className="px-2 py-1 text-text-light disabled:opacity-30 hover:text-text" aria-label="Aşağı">↓</button>
                <button onClick={() => removeStep(i)} className="px-2 py-1 text-red-500 hover:text-red-700" aria-label="Sil">✕</button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-8">
        <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors">
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
