"use client";

import { useState, useEffect, useRef } from "react";

type Banner = {
  id: string;
  text: string;
  url: string | null;
  bgColor: string;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
};
type Category = { id: string; name: string; slug: string; parentId: string | null };
type Product  = { id: string; name: string; slug: string };
type Coupon   = { id: string; code: string; discount_type: string; discount_value: number; is_active: boolean };

const PRESET_COLORS = [
  { label: "Mor",        value: "#6d55e8" },
  { label: "Terracotta", value: "#e07a5f" },
  { label: "Lacivert",   value: "#3d405b" },
  { label: "Yeşil",      value: "#2d6a4f" },
  { label: "Siyah",      value: "#1a1a1a" },
];

const EMOJI_GROUPS = [
  { label: "Kampanya", emojis: ["🔥","⚡","💥","🎉","🎊","✨","🏷️","💰","🤑","💸","🎯","📣"] },
  { label: "Fotoğraf", emojis: ["📷","📸","🖼️","🖨️","📚","📖","🗂️","🎞️","🌄","🌅"] },
  { label: "Hediye",   emojis: ["🎁","🎀","💝","🎈","🛍️","💌","🌹","🌸"] },
  { label: "Sezon",    emojis: ["☀️","🌸","🍂","❄️","🎄","🎆","💫","🌟","⭐","🌙"] },
  { label: "Genel",    emojis: ["❤️","💛","🙌","👆","→","🆕","🔑","⏰","🚀","✅"] },
];

export default function AdminBannerPage() {
  const [banners,    setBanners]    = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [coupons,    setCoupons]    = useState<Coupon[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [activeEmojiGroup, setActiveEmojiGroup] = useState(0);
  const textRef = useRef<HTMLInputElement>(null);

  const emptyForm = { text: "", url: "", bgColor: "#6d55e8", isActive: true, startAt: "", endAt: "" };
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const [bRes, cRes, pRes, couRes] = await Promise.all([
      fetch("/api/admin/banners"),
      fetch("/api/admin/categories"),
      fetch("/api/admin/products"),
      fetch("/api/admin/promotions"),
    ]);
    setBanners(bRes.ok ? await bRes.json() : []);
    setCategories(cRes.ok ? await cRes.json() : []);
    setProducts(pRes.ok ? await pRes.json() : []);
    // Kupon kodları artık promotions tablosunda (trigger='code')
    setCoupons(couRes.ok
      ? (await couRes.json())
          .filter((p: { trigger: string; is_active: boolean; code: string | null }) => p.trigger === "code" && p.is_active && p.code)
          .map((p: { id: string; code: string; value_type: string; value: number }) => ({
            id: p.id, code: p.code,
            discount_type: p.value_type === "percentage" ? "percentage" : "fixed",
            discount_value: Number(p.value), is_active: true,
          }))
      : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Emoji: imlecin bulunduğu yere ekle
  function insertEmoji(emoji: string) {
    const input = textRef.current;
    if (!input) { setForm(f => ({ ...f, text: f.text + emoji })); return; }
    const start = input.selectionStart ?? form.text.length;
    const end   = input.selectionEnd   ?? form.text.length;
    const newText = form.text.slice(0, start) + emoji + form.text.slice(end);
    setForm(f => ({ ...f, text: newText }));
    // imleci emoji'nin arkasına taşı
    setTimeout(() => { input.focus(); input.setSelectionRange(start + emoji.length, start + emoji.length); }, 0);
  }

  // Kupon seçince text + url doldur
  function selectCoupon(coupon: Coupon) {
    const label = coupon.discount_type === "percentage"
      ? `%${coupon.discount_value}`
      : `${coupon.discount_value}₺`;
    setForm(f => ({
      ...f,
      text: f.text
        ? f.text + ` · Kod: ${coupon.code}`
        : `${label} indirim! Kod: ${coupon.code} 🎉`,
      url: "/sepet",
    }));
  }

  // Kategori seçince url doldur
  function selectCategory(cat: Category) {
    setForm(f => ({ ...f, url: `/kategoriler/${cat.slug}` }));
  }

  // Ürün seçince url doldur
  function selectProduct(p: Product) {
    setForm(f => ({ ...f, url: `/urunler/${p.slug}` }));
  }

  async function handleSave() {
    if (!form.text.trim()) { setError("Metin zorunlu."); return; }
    setSaving(true); setError("");
    const body = {
      ...form,
      url:     form.url.trim() || null,
      startAt: form.startAt || null,
      endAt:   form.endAt   || null,
      ...(editingId ? { id: editingId } : {}),
    };
    const res = await fetch("/api/admin/banners", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Kaydedilemedi."); }
    else { setForm(emptyForm); setEditingId(null); setShowForm(false); await load(); }
    setSaving(false);
  }

  async function toggleActive(b: Banner) {
    await fetch("/api/admin/banners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, text: b.text, url: b.url, bgColor: b.bgColor, isActive: !b.isActive, startAt: b.startAt, endAt: b.endAt }),
    });
    await load();
  }

  async function handleDelete(id: string) {
    await fetch("/api/admin/banners", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
  }

  function startEdit(b: Banner) {
    setEditingId(b.id);
    setForm({ text: b.text, url: b.url ?? "", bgColor: b.bgColor, isActive: b.isActive, startAt: b.startAt?.slice(0,16) ?? "", endAt: b.endAt?.slice(0,16) ?? "" });
    setShowForm(true); setError("");
  }

  const inputCls = "px-3 py-2 rounded-lg border border-border bg-bg text-sm outline-none focus:border-primary transition-colors w-full";
  const chipCls  = "px-3 py-1.5 rounded-full border border-border text-xs font-semibold text-text-light hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer truncate max-w-[160px]";

  const parentCats = categories.filter(c => !c.parentId);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-text">Duyuru Bandı</h1>
        {!showForm && (
          <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); setError(""); }}
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-full transition-colors">
            + Yeni Banner
          </button>
        )}
      </div>

      {/* ── FORM ──────────────────────────────────────── */}
      {showForm && (
        <>
          {/* Önizleme */}
          {form.text && (
            <div className="mb-4 rounded-xl overflow-hidden border border-border">
              <p className="text-xs text-text-light px-4 py-2 bg-bg border-b border-border">Önizleme</p>
              <div className="py-2.5 flex items-center justify-center" style={{ backgroundColor: form.bgColor }}>
                <span className="text-sm font-semibold text-white">{form.text}</span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-border p-6 mb-8 flex flex-col gap-5">
            <h2 className="font-serif text-lg text-text">{editingId ? "Banner Düzenle" : "Yeni Banner"}</h2>

            {/* ── Metin + Emoji ── */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text">Metin</label>
              <input
                ref={textRef}
                value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                className={inputCls}
                placeholder="Yaz kargo bedava! · Kod: YAZ20 🎉"
              />

              {/* Emoji seçici */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="flex border-b border-border bg-bg">
                  {EMOJI_GROUPS.map((g, i) => (
                    <button key={g.label} type="button"
                      onClick={() => setActiveEmojiGroup(i)}
                      className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${activeEmojiGroup === i ? "bg-white text-primary border-b-2 border-primary" : "text-text-light hover:text-text"}`}>
                      {g.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 p-2 bg-white">
                  {EMOJI_GROUPS[activeEmojiGroup].emojis.map(e => (
                    <button key={e} type="button" onClick={() => insertEmoji(e)}
                      className="w-9 h-9 text-xl rounded-lg hover:bg-bg transition-colors flex items-center justify-center">
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Kupon Seç ── */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text">
                Kupon Ekle <span className="font-normal text-text-light">(seçince metne ekler)</span>
              </label>
              {coupons.length === 0 ? (
                <p className="text-xs text-text-light">Aktif kupon yok.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {coupons.map(c => (
                    <button key={c.id} type="button" onClick={() => selectCoupon(c)}
                      className={chipCls} title={`${c.discount_type === "percentage" ? "%" + c.discount_value : c.discount_value + "₺"} indirim`}>
                      🏷️ {c.code} · {c.discount_type === "percentage" ? `%${c.discount_value}` : `${c.discount_value}₺`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Link ── */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text">
                Link <span className="font-normal text-text-light">(opsiyonel)</span>
              </label>
              <input
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                className={inputCls}
                placeholder="/urunler  veya  /kategoriler/fotokitap"
              />

              {/* Kategori seçici */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-text-light uppercase tracking-wide">Kategori</p>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => setForm(f => ({ ...f, url: "/urunler" }))} className={chipCls}>
                    🗂️ Tüm Ürünler
                  </button>
                  {parentCats.map(p => {
                    const children = categories.filter(c => c.parentId === p.id);
                    return (
                      <div key={p.id} className="flex flex-wrap gap-1.5">
                        <button type="button" onClick={() => selectCategory(p)} className={chipCls}>
                          📂 {p.name}
                        </button>
                        {children.map(sub => (
                          <button key={sub.id} type="button" onClick={() => selectCategory(sub)} className={chipCls + " pl-3 border-dashed"}>
                            ↳ {sub.name}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ürün seçici */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-text-light uppercase tracking-wide">Ürün</p>
                {products.length === 0 ? (
                  <p className="text-xs text-text-light">Ürün bulunamadı.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {products.map(p => (
                      <button key={p.id} type="button" onClick={() => selectProduct(p)} className={chipCls}>
                        🖼️ {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Renk ── */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text">Renk</label>
              <div className="flex gap-2 flex-wrap items-center">
                {PRESET_COLORS.map(c => (
                  <button key={c.value} type="button" onClick={() => setForm(f => ({ ...f, bgColor: c.value }))}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${form.bgColor === c.value ? "border-text scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c.value }} title={c.label} />
                ))}
                <input type="color" value={form.bgColor} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))}
                  className="w-8 h-8 rounded-full cursor-pointer border border-border" title="Özel renk" />
                <span className="text-xs text-text-light font-mono">{form.bgColor}</span>
              </div>
            </div>

            {/* ── Tarih ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text">Başlangıç <span className="font-normal text-text-light">(opsiyonel)</span></label>
                <input type="datetime-local" value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text">Bitiş <span className="font-normal text-text-light">(opsiyonel)</span></label>
                <input type="datetime-local" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} className={inputCls} />
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-primary" />
              <span className="text-sm text-text">Hemen aktif et</span>
            </label>

            {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                className="flex-1 py-2.5 border border-border text-sm font-semibold rounded-full hover:border-primary transition-colors">
                İptal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors">
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── LİSTE ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-serif text-lg text-text">Mevcut Bannerlar</h2>
        </div>
        {loading ? (
          <p className="text-sm text-text-light p-6">Yükleniyor...</p>
        ) : !banners.length ? (
          <p className="text-sm text-text-light p-6">Henüz banner yok.</p>
        ) : (
          <ul className="divide-y divide-border">
            {banners.map(b => (
              <li key={b.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-3 h-10 rounded-full shrink-0" style={{ backgroundColor: b.bgColor }} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold text-text truncate ${!b.isActive ? "opacity-40" : ""}`}>{b.text}</p>
                  {b.url && <p className="text-xs text-text-light truncate">{b.url}</p>}
                  {(b.startAt || b.endAt) && (
                    <p className="text-xs text-text-light mt-0.5">
                      {b.startAt ? new Date(b.startAt).toLocaleDateString("tr-TR") : "—"} → {b.endAt ? new Date(b.endAt).toLocaleDateString("tr-TR") : "∞"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => toggleActive(b)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${b.isActive ? "bg-green-500" : "bg-border"}`}
                    title={b.isActive ? "Pasife al" : "Aktife al"}>
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${b.isActive ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
                  </button>
                  <button onClick={() => startEdit(b)} className="text-xs text-primary hover:underline font-semibold">Düzenle</button>
                  <button onClick={() => handleDelete(b.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold">Sil</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
