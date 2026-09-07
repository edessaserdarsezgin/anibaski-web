"use client";

import CustomSelect from "@/components/ui/CustomSelect";
import { CITY_OPTIONS, cityCodeFromName, cityNameFromCode } from "@/lib/shipping/cities";

/**
 * İl seçici — adres formlarında serbest metin yerine kullanılır.
 *
 * Neden seçim: taşıyıcı API'leri il'i plaka KODU bekliyor (Aras `CityCode`,
 * agregatörlerde `state_id`). Serbest metinde "İstanbul/istanbul/İST" gibi
 * varyasyonlar kodla eşleşmiyor ve gönderi oluşturma hata veriyor.
 *
 * Dışarıya hem kodu hem resmî il adını verir; `addresses.city` (ad) ve
 * `addresses.city_code` (kod) birlikte tutulur — eski kayıtlar ad üzerinden
 * okunmaya devam eder.
 */
export default function CitySelect({
  city,
  cityCode,
  onChange,
  className = "",
}: {
  /** Kayıtlı il adı — kod boşsa buradan türetilir (eski serbest metin kayıtlar). */
  city: string;
  cityCode: string;
  onChange: (next: { city: string; cityCode: string }) => void;
  className?: string;
}) {
  const value = cityCode || cityCodeFromName(city) || "";

  return (
    <CustomSelect
      value={value}
      onChange={code => onChange({ city: cityNameFromCode(code) ?? "", cityCode: code })}
      options={[{ value: "", label: "İl seçin", disabled: true }, ...CITY_OPTIONS]}
      ariaLabel="İl"
      className={className}
    />
  );
}
