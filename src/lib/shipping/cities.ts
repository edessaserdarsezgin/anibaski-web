// src/lib/shipping/cities.ts — 81 il ve plaka kodu. Saf veri + eşleştirme, DB/ağ bağımlılığı YOK.
//
// Neden gerekli: taşıyıcı API'leri il'i SERBEST METİN değil KOD bekliyor.
//   · Aras  `GetPriceCalculation` → gonderici_ilkodu / alici_ilkodu (plaka)
//   · Aras  `SetOrder`            → CityCode / TownCode
//   · Agregatörler                → state_id / city_id
// Bu yüzden `addresses.city_code` sağlayıcı seçiminden bağımsız bir gereksinim.

import { trKey as normalize } from "@/lib/text";

export type City = { code: string; name: string };

/** Plaka kodu → il adı. Kod iki haneli string ("01"), taşıyıcı API'leri baştaki sıfırı bekler. */
export const CITIES: City[] = [
  { code: "01", name: "Adana" },          { code: "02", name: "Adıyaman" },
  { code: "03", name: "Afyonkarahisar" }, { code: "04", name: "Ağrı" },
  { code: "05", name: "Amasya" },         { code: "06", name: "Ankara" },
  { code: "07", name: "Antalya" },        { code: "08", name: "Artvin" },
  { code: "09", name: "Aydın" },          { code: "10", name: "Balıkesir" },
  { code: "11", name: "Bilecik" },        { code: "12", name: "Bingöl" },
  { code: "13", name: "Bitlis" },         { code: "14", name: "Bolu" },
  { code: "15", name: "Burdur" },         { code: "16", name: "Bursa" },
  { code: "17", name: "Çanakkale" },      { code: "18", name: "Çankırı" },
  { code: "19", name: "Çorum" },          { code: "20", name: "Denizli" },
  { code: "21", name: "Diyarbakır" },     { code: "22", name: "Edirne" },
  { code: "23", name: "Elazığ" },         { code: "24", name: "Erzincan" },
  { code: "25", name: "Erzurum" },        { code: "26", name: "Eskişehir" },
  { code: "27", name: "Gaziantep" },      { code: "28", name: "Giresun" },
  { code: "29", name: "Gümüşhane" },      { code: "30", name: "Hakkâri" },
  { code: "31", name: "Hatay" },          { code: "32", name: "Isparta" },
  { code: "33", name: "Mersin" },         { code: "34", name: "İstanbul" },
  { code: "35", name: "İzmir" },          { code: "36", name: "Kars" },
  { code: "37", name: "Kastamonu" },      { code: "38", name: "Kayseri" },
  { code: "39", name: "Kırklareli" },     { code: "40", name: "Kırşehir" },
  { code: "41", name: "Kocaeli" },        { code: "42", name: "Konya" },
  { code: "43", name: "Kütahya" },        { code: "44", name: "Malatya" },
  { code: "45", name: "Manisa" },         { code: "46", name: "Kahramanmaraş" },
  { code: "47", name: "Mardin" },         { code: "48", name: "Muğla" },
  { code: "49", name: "Muş" },            { code: "50", name: "Nevşehir" },
  { code: "51", name: "Niğde" },          { code: "52", name: "Ordu" },
  { code: "53", name: "Rize" },           { code: "54", name: "Sakarya" },
  { code: "55", name: "Samsun" },         { code: "56", name: "Siirt" },
  { code: "57", name: "Sinop" },          { code: "58", name: "Sivas" },
  { code: "59", name: "Tekirdağ" },       { code: "60", name: "Tokat" },
  { code: "61", name: "Trabzon" },        { code: "62", name: "Tunceli" },
  { code: "63", name: "Şanlıurfa" },      { code: "64", name: "Uşak" },
  { code: "65", name: "Van" },            { code: "66", name: "Yozgat" },
  { code: "67", name: "Zonguldak" },      { code: "68", name: "Aksaray" },
  { code: "69", name: "Bayburt" },        { code: "70", name: "Karaman" },
  { code: "71", name: "Kırıkkale" },      { code: "72", name: "Batman" },
  { code: "73", name: "Şırnak" },         { code: "74", name: "Bartın" },
  { code: "75", name: "Ardahan" },        { code: "76", name: "Iğdır" },
  { code: "77", name: "Yalova" },         { code: "78", name: "Karabük" },
  { code: "79", name: "Kilis" },          { code: "80", name: "Osmaniye" },
  { code: "81", name: "Düzce" },
];


/**
 * Halk arasında kullanılan eski/kısa adlar. Mevcut serbest metin adresleri
 * kod'a bağlarken (backfill) gerekli — kullanıcılar resmî adı yazmıyor.
 */
const ALIASES: Record<string, string> = {
  afyon: "03",
  icel: "33",           // Mersin'in eski adı
  maras: "46",
  kmaras: "46",
  kahramanmars: "46",
  urfa: "63",
  antep: "27",
  gantep: "27",
  hakkari: "30",
  sanliurfa: "63",
  istanbulanadolu: "34",
  istanbulavrupa: "34",
};

/** Normalize edilmiş il adı → plaka kodu. Modül yüklenirken bir kez kurulur. */
const BY_NAME: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const c of CITIES) m.set(normalize(c.name), c.code);
  for (const [alias, code] of Object.entries(ALIASES)) m.set(normalize(alias), code);
  return m;
})();

/** Plaka kodu → il. */
const BY_CODE: Map<string, City> = new Map(CITIES.map(c => [c.code, c]));

/**
 * Serbest metin il adından plaka kodu bulur; eşleşmezse null.
 * Mevcut `addresses.city` metinlerini `city_code`'a taşımak için kullanılır.
 */
export function cityCodeFromName(name: string | null | undefined): string | null {
  if (!name) return null;
  return BY_NAME.get(normalize(name)) ?? null;
}

/** Plaka kodundan resmî il adı; geçersizse null. */
export function cityNameFromCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return BY_CODE.get(code.padStart(2, "0"))?.name ?? null;
}

/** CustomSelect için hazır seçenek listesi (alfabetik — plaka sırası değil). */
export const CITY_OPTIONS = [...CITIES]
  .sort((a, b) => a.name.localeCompare(b.name, "tr"))
  .map(c => ({ value: c.code, label: c.name }));
