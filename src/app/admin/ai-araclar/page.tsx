"use client";

import { useEffect, useState } from "react";
import type { StudioToolRow } from "@/lib/studioTools";

type Draft = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  engine: "" | "upscale" | "edit";
  lora: string;
  prompt: string;
  generative: boolean;
  active: boolean;
  sortOrder: number;
};

const EMPTY: Draft = {
  slug: "", name: "", description: "", icon: "✨",
  engine: "edit", lora: "", prompt: "", generative: true, active: false, sortOrder: 0,
};

// Araçlara uygun hazır emojiler (tıklayınca ikon olur; yine de elle yazılabilir).
const EMOJI_CHOICES = [
  "✨", "🔍", "🎴", "🧸", "🎨", "🪄", "💫", "🖼️", "📸", "🌈",
  "🎭", "🦸", "👤", "🌟", "🪞", "🎬", "🌅", "🖌️", "🧩", "⚡",
];

function toDraft(t: StudioToolRow): Draft {
  return {
    id: t.id, slug: t.slug, name: t.name, description: t.description, icon: t.icon,
    engine: (t.engine ?? "") as Draft["engine"], lora: t.lora ?? "", prompt: t.prompt ?? "",
    generative: t.generative, active: t.active, sortOrder: t.sortOrder,
  };
}

export default function AiAraclarPage() {
  const [tools, setTools] = useState<StudioToolRow[] | null>(null);
  const [loras, setLoras] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function loadTools() {
    fetch("/api/admin/studio-tools").then((r) => r.json()).then(setTools).catch(() => setTools([]));
  }
  useEffect(() => {
    loadTools();
    fetch("/api/admin/studio-tools/loras").then((r) => r.json()).then((d) => Array.isArray(d) && setLoras(d)).catch(() => {});
  }, []);

  async function toggleActive(t: StudioToolRow) {
    const res = await fetch(`/api/admin/studio-tools/${t.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !t.active }),
    });
    if (res.ok) setTools(await res.json());
  }

  async function save() {
    if (!draft) return;
    if (!draft.slug.trim() || !draft.name.trim()) { setMsg("Slug ve ad zorunlu"); return; }
    setBusy(true); setMsg(null);
    const payload = {
      slug: draft.slug.trim(), name: draft.name.trim(), description: draft.description,
      icon: draft.icon, engine: draft.engine || null, lora: draft.lora || null,
      prompt: draft.prompt || null, generative: draft.generative, active: draft.active, sortOrder: draft.sortOrder,
    };
    const res = draft.id
      ? await fetch(`/api/admin/studio-tools/${draft.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch(`/api/admin/studio-tools`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setBusy(false);
    if (res.ok) { setTools(await res.json()); setDraft(null); }
    else { const d = await res.json().catch(() => ({})); setMsg(d.error ?? "Hata oluştu"); }
  }

  async function remove(t: StudioToolRow) {
    if (!confirm(`"${t.name}" aracını silmek istediğine emin misin?`)) return;
    const res = await fetch(`/api/admin/studio-tools/${t.id}`, { method: "DELETE" });
    if (res.ok) setTools(await res.json());
  }

  if (tools === null) return <div className="text-secondary">Yükleniyor...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-text">AI Stüdyo Araçları</h1>
        <button onClick={() => { setDraft({ ...EMPTY, sortOrder: tools.length }); setMsg(null); }}
          className="py-2 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-full">
          + Yeni Araç
        </button>
      </div>

      <div className="flex flex-col gap-2 mb-8">
        {tools.map((t) => (
          <div key={t.id} className="flex items-center gap-3 bg-white border border-border rounded-2xl px-4 py-3">
            <span className="text-2xl">{t.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text truncate">{t.name}</p>
              <p className="text-xs text-text-light">
                {t.slug} · {t.engine ?? "yakında"}{t.lora ? ` · ${t.lora}` : ""}
              </p>
            </div>
            <button onClick={() => toggleActive(t)}
              className={`text-xs font-semibold px-3 py-1 rounded-full border ${t.active ? "bg-green-50 text-green-700 border-green-200" : "bg-bg text-text-light border-border"}`}>
              {t.active ? "Aktif" : "Pasif"}
            </button>
            <button onClick={() => { setDraft(toDraft(t)); setMsg(null); }} className="text-xs text-primary font-semibold hover:underline">Düzenle</button>
            <button onClick={() => remove(t)} className="text-xs text-red-600 font-semibold hover:underline">Sil</button>
          </div>
        ))}
      </div>

      {draft && (
        <div className="bg-white border border-border rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="font-serif text-xl text-text">{draft.id ? "Aracı Düzenle" : "Yeni Araç"}</h2>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text">Slug</span>
              <input value={draft.slug} disabled={!!draft.id}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                className="border border-border rounded-xl px-3 py-2 disabled:bg-bg disabled:text-text-light" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text">İkon (emoji)</span>
              <input value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                className="border border-border rounded-xl px-3 py-2" />
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5 -mt-1">
            {EMOJI_CHOICES.map((em) => (
              <button key={em} type="button" onClick={() => setDraft({ ...draft, icon: em })}
                className={`w-9 h-9 rounded-lg border text-lg flex items-center justify-center transition-colors ${
                  draft.icon === em ? "border-primary bg-primary/10" : "border-border hover:border-primary"
                }`}>
                {em}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-text">Ad</span>
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="border border-border rounded-xl px-3 py-2" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-text">Açıklama</span>
            <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="border border-border rounded-xl px-3 py-2" />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text">Motor</span>
              <select value={draft.engine} onChange={(e) => setDraft({ ...draft, engine: e.target.value as Draft["engine"] })}
                className="border border-border rounded-xl px-3 py-2">
                <option value="">Yakında (motorsuz)</option>
                <option value="upscale">upscale (AuraSR)</option>
                <option value="edit">edit (Qwen LoRA)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text">Sıra</span>
              <input type="number" value={draft.sortOrder}
                onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
                className="border border-border rounded-xl px-3 py-2" />
            </label>
          </div>

          {draft.engine === "edit" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-text">LoRA adaptörü</span>
                <select value={draft.lora} onChange={(e) => setDraft({ ...draft, lora: e.target.value })}
                  className="border border-border rounded-xl px-3 py-2">
                  <option value="">— seç —</option>
                  {loras.map((l) => <option key={l} value={l}>{l}</option>)}
                  {draft.lora && !loras.includes(draft.lora) && <option value={draft.lora}>{draft.lora} (mevcut)</option>}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-text">Prompt</span>
                <textarea value={draft.prompt} rows={2} onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
                  className="border border-border rounded-xl px-3 py-2" />
              </label>
            </>
          )}

          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" checked={draft.generative} onChange={(e) => setDraft({ ...draft, generative: e.target.checked })} />
              Generative (uyarı göster)
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
              Aktif
            </label>
          </div>

          {msg && <p className="text-sm text-red-600">{msg}</p>}

          <div className="flex items-center gap-3">
            <button onClick={save} disabled={busy}
              className="py-2.5 px-6 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full disabled:opacity-50">
              {busy ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button onClick={() => { setDraft(null); setMsg(null); }} className="text-sm text-text-light hover:text-text">Vazgeç</button>
          </div>
        </div>
      )}
    </div>
  );
}
