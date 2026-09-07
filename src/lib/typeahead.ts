// src/lib/typeahead.ts — açılır menüde harfe atlama. Saf; DOM/React bağımlılığı YOK.
//
// Native <select>'in verdiği, uzun listede vazgeçilmez olan davranış: 81 il arasında
// "i" yazınca İstanbul'a gitmek, ok tuşuyla 34 basamak inmekten kısa. Bileşenin
// içinde kalsaydı ancak tarayıcıda denenebilirdi; burada saf olduğu için test edilebilir.

import { trKey } from "./text";

/** Yazılan harflerin biriktirileceği süre. Aşılırsa tampon sıfırlanır. */
export const TYPEAHEAD_RESET_MS = 800;

export type TypeaheadState = { text: string; at: number };

type Option = { label: string; disabled?: boolean };

/**
 * Bir tuş vuruşunu işler: yeni tamponu ve atlanacak seçenek indeksini döner.
 *
 * Kurallar (native <select> davranışı):
 *  - Tampon `TYPEAHEAD_RESET_MS` içinde birikir ("izm" → İzmir), sonra sıfırlanır.
 *  - Tek harf ya da aynı harfin tekrarı → o harfle başlayanlar arasında **döner**
 *    (aktif indeksten sonrasına bakar, sona gelince başa sarar).
 *  - Çok harfli aramada listenin **başından** aranır, döngü yapılmaz.
 *  - Devre dışı seçenekler atlanır. Eşleşme yoksa `index: null` döner.
 *  - Karşılaştırma Türkçe duyarlıdır: "istanbul" da "İSTANBUL" da eşleşir.
 */
export function typeaheadStep(params: {
  options: Option[];
  activeIdx: number;
  key: string;
  now: number;
  prev: TypeaheadState;
}): { state: TypeaheadState; index: number | null } {
  const { options, activeIdx, key, now, prev } = params;

  const text = now - prev.at > TYPEAHEAD_RESET_MS ? key : prev.text + key;
  const state: TypeaheadState = { text, at: now };

  const cycling = new Set(trKey(text).split("")).size <= 1;
  const needle = cycling ? trKey(key) : trKey(text);
  if (!needle) return { state, index: null };

  const start = cycling ? activeIdx + 1 : 0;
  for (let n = 0; n < options.length; n++) {
    const i = (((start + n) % options.length) + options.length) % options.length;
    const o = options[i];
    if (o.disabled) continue;
    if (trKey(o.label).startsWith(needle)) return { state, index: i };
  }
  return { state, index: null };
}
