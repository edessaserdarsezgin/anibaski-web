"use client";

import CustomSelect from "@/components/ui/CustomSelect";
import { districtOptions, normalizeDistrict } from "@/lib/shipping/districts";

/**
 * İlçe seçici — `CitySelect`'in ikizi, ona bağımlı çalışır.
 *
 * Neden seçim: serbest metinde aynı ilçe "Altındağ"/"altındağ"/"ALTINDAĞ" diye
 * dağılıyor; taşıyıcı gönderi oluştururken ilçe adını eşleştirdiği için
 * (Aras `SetOrder` → `ReceiverTownName`) eşleşmeyen ad gönderiyi hataya düşürür.
 *
 * Eski serbest metin kayıtlar `normalizeDistrict` ile listedeki resmî yazıma
 * eşlenip seçili gelir; kayıt düzenlenince veri kendiliğinden standarda oturur.
 */
export default function DistrictSelect({
  cityCode,
  district,
  onChange,
  className = "",
}: {
  /** Seçili ilin plaka kodu. Boşsa seçici devre dışıdır. */
  cityCode: string;
  /** Kayıtlı ilçe adı — serbest metin olabilir, normalize edilerek eşlenir. */
  district: string;
  onChange: (district: string) => void;
  className?: string;
}) {
  const options = districtOptions(cityCode);
  const hasCity = options.length > 0;
  const value = hasCity ? (normalizeDistrict(cityCode, district) ?? "") : "";

  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={[
        { value: "", label: hasCity ? "İlçe seçin" : "Önce il seçin", disabled: true },
        ...options,
      ]}
      disabled={!hasCity}
      ariaLabel="İlçe"
      className={className}
    />
  );
}
