"use client";

import { billableDesi, volumetricDesi, type PackageDimensions } from "@/lib/shipping/desi";

export type DimensionsValue = {
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  weight_kg: number | null;
};

export const EMPTY_DIMENSIONS: DimensionsValue = {
  length_cm: null, width_cm: null, height_cm: null, weight_kg: null,
};

/** Boş string → null, sayı → sayı. 0 ve negatif geçersiz sayılır (null'a düşer). */
function parse(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const inputCls = "px-4 py-2.5 rounded-lg border border-border bg-bg text-sm outline-none focus:border-primary transition-colors";

/**
 * Ürün kargo ölçüleri (desi) girişi — ürün ekleme ve düzenleme formlarında ortak.
 * Girilen değerlerden desiyi canlı hesaplayıp gösterir; hangi değerin faturalanacağını
 * (hacim mi ağırlık mı) açıkça yazar, çünkü admin genelde ağırlığın belirleyici
 * olduğunu sanır — büyük formatta belirleyici olan hacimdir.
 */
export default function DimensionsField({
  value,
  onChange,
}: {
  value: DimensionsValue;
  onChange: (v: DimensionsValue) => void;
}) {
  const set = (key: keyof DimensionsValue) => (raw: string) =>
    onChange({ ...value, [key]: parse(raw) });

  const complete =
    value.length_cm !== null && value.width_cm !== null &&
    value.height_cm !== null && value.weight_kg !== null;

  const dims: PackageDimensions | null = complete
    ? {
        length: value.length_cm as number,
        width: value.width_cm as number,
        height: value.height_cm as number,
        weight: value.weight_kg as number,
      }
    : null;

  const volumetric = dims ? volumetricDesi(dims) : null;
  const billable = dims ? billableDesi(dims) : null;
  const weightWins = dims !== null && volumetric !== null && dims.weight > volumetric;

  const fields: Array<{ key: keyof DimensionsValue; label: string; unit: string; step: string }> = [
    { key: "length_cm", label: "En",         unit: "cm", step: "0.1" },
    { key: "width_cm",  label: "Boy",        unit: "cm", step: "0.1" },
    { key: "height_cm", label: "Yükseklik",  unit: "cm", step: "0.1" },
    { key: "weight_kg", label: "Ağırlık",    unit: "kg", step: "0.001" },
  ];

  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-border">
      <div>
        <p className="text-sm font-semibold text-text">Kargo Ölçüleri (Desi)</p>
        <p className="text-xs text-text-light mt-0.5">
          ⚠️ Ürünün değil, <strong>paketlenmiş hâlinin</strong> ölçüsünü gir — ambalaj ve koruyucu dahil.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {fields.map(f => (
          <div key={f.key} className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">
              {f.label}
              <span className="ml-1 text-xs font-normal text-text-light">({f.unit})</span>
            </label>
            <input
              type="number" min={0} step={f.step}
              value={value[f.key] ?? ""}
              onChange={e => set(f.key)(e.target.value)}
              className={inputCls}
              placeholder="—"
            />
          </div>
        ))}
      </div>

      {billable !== null && volumetric !== null ? (
        <div className="text-sm bg-white border border-border rounded-lg px-4 py-3 flex flex-col gap-1">
          <p className="text-text">
            Hacimsel desi: <strong>{volumetric.toLocaleString("tr-TR")}</strong>
            <span className="text-text-light"> · (En × Boy × Yükseklik) ÷ 3000</span>
          </p>
          <p className="text-text">
            Faturalanan desi: <strong className="text-primary">{billable.toLocaleString("tr-TR")}</strong>
            <span className="text-text-light">
              {" "}· {weightWins ? "ağırlık belirleyici" : "hacim belirleyici"}
            </span>
          </p>
        </div>
      ) : (
        <p className="text-xs text-text-light">
          Dört alan da doldurulunca desi otomatik hesaplanır. Ölçüsü olmayan ürünler kargo
          hesabına dahil edilemez.
        </p>
      )}
    </div>
  );
}
