// Bu dosya SADECE saf tip/sabit/normalize içerir (server importu YOK) — hem client
// (admin editör) hem server (makbuz) güvenle import edebilsin. DB yükleyici → documents.server.ts
// Belge (makbuz vb.) yapılandırma tipi — Seviye 1: bölüm aç/kapa + sıra + metinler.
export type DocSectionKey = "meta" | "customer" | "products" | "adminNote" | "processSteps" | "trackingCode";

export type DocSection = { key: DocSectionKey; enabled: boolean };

export type MakbuzConfig = {
  headerTitle: string;
  logoUrl: string | null;
  showQr: boolean;
  showPhotos: boolean;
  processSteps: string[];
  footerText: string;
  sections: DocSection[];
};

// Admin arayüzünde gösterilecek bölüm etiketleri
export const SECTION_LABELS: Record<DocSectionKey, string> = {
  meta: "Sipariş bilgileri (tarih / durum / tür)",
  customer: "Müşteri + teslimat adresi",
  products: "Ürünler tablosu",
  adminNote: "İç not",
  processSteps: "Süreç takip kutucukları",
  trackingCode: "Kargo kodu alanı",
};

export const DEFAULT_MAKBUZ_CONFIG: MakbuzConfig = {
  headerTitle: "İş Emri / Makbuz",
  logoUrl: null,
  showQr: true,
  showPhotos: true,
  processSteps: ["Hazırlanıyor", "Baskı", "Kontrol", "Paketleme", "Kargo", "Teslim"],
  footerText: "",
  sections: [
    { key: "meta", enabled: true },
    { key: "customer", enabled: true },
    { key: "products", enabled: true },
    { key: "adminNote", enabled: true },
    { key: "processSteps", enabled: true },
    { key: "trackingCode", enabled: true },
  ],
};

/** Kayıtlı config'i varsayılanla birleştirir (eksik/yeni alanlar için güvenli). */
export function mergeMakbuzConfig(raw: unknown): MakbuzConfig {
  const c = (raw ?? {}) as Partial<MakbuzConfig>;
  const savedSections = Array.isArray(c.sections) ? c.sections : [];
  // Varsayılan bölümleri kayıtlı sıraya göre diz; eksik olanları sona ekle (yeni tür eklenince kaybolmasın)
  const known = DEFAULT_MAKBUZ_CONFIG.sections.map((s) => s.key);
  const ordered: DocSection[] = [];
  for (const s of savedSections) {
    if (known.includes(s.key as DocSectionKey)) ordered.push({ key: s.key as DocSectionKey, enabled: s.enabled !== false });
  }
  for (const k of known) {
    if (!ordered.find((s) => s.key === k)) ordered.push({ key: k, enabled: true });
  }
  return {
    headerTitle: typeof c.headerTitle === "string" ? c.headerTitle : DEFAULT_MAKBUZ_CONFIG.headerTitle,
    logoUrl: typeof c.logoUrl === "string" ? c.logoUrl : null,
    showQr: c.showQr !== false,
    showPhotos: c.showPhotos !== false,
    processSteps: Array.isArray(c.processSteps) && c.processSteps.length ? c.processSteps.map(String) : DEFAULT_MAKBUZ_CONFIG.processSteps,
    footerText: typeof c.footerText === "string" ? c.footerText : "",
    sections: ordered,
  };
}
