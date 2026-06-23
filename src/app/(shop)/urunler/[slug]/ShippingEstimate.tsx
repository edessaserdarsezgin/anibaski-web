"use client";

import { useEffect, useState } from "react";
import { isNonWorkingDay, isNationalHoliday, parseHolidaySet, toYMD } from "@/lib/holidays";

type Estimate = { acceptedToday: boolean; cutoffHour: number; label: string };

/**
 * "Ne zaman kargoda?" — sipariş şu an verilirse ürünün hangi gün kargoya
 * verileceğini somut tarih + gün adıyla gösterir (Sosyopix'ten farkımız: "yarın"
 * yerine gerçek tarih). TR saatiyle hesaplanır, hafta sonları atlanır.
 * Tarih "now"a bağlı olduğundan hidrasyon uyuşmazlığını önlemek için mount sonrası hesaplanır.
 */
export default function ShippingEstimate({
  cutoffHour = 14,
  dispatchBusinessDays = 1,
  extraHolidays = "",
  mode = "cart",
}: {
  cutoffHour?: number;
  dispatchBusinessDays?: number;
  extraHolidays?: string;
  /** "cart": ürün sayfası metni; "order": sipariş sonrası tahmini teslimat metni */
  mode?: "cart" | "order";
}) {
  const [est, setEst] = useState<Estimate | null>(null);

  useEffect(() => {
    const holidays = parseHolidaySet(extraHolidays);
    // Kargo çalışır günü = hafta sonu değil + resmî/ek tatil değil
    const isBiz = (d: Date) => !isNonWorkingDay(d, holidays);
    // Baskı/hazırlık günü = hafta sonu DAHİL (biz hafta sonu baskı yapıyoruz); yalnız resmî/ek tatil hariç
    const isProd = (d: Date) => !isNationalHoliday(d) && !holidays.has(toYMD(d));

    // TR duvar saatini al (kullanıcının cihaz saat dilimi ne olursa olsun)
    const trNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));

    const acceptedToday = isProd(trNow) && trNow.getHours() < cutoffHour;

    // Kabul (üretime giriş) günü: bugün (baskı günü + cutoff öncesi) ya da bir sonraki baskı günü
    const acceptance = new Date(trNow);
    acceptance.setHours(0, 0, 0, 0);
    if (!acceptedToday) {
      do { acceptance.setDate(acceptance.getDate() + 1); } while (!isProd(acceptance));
    }

    // Hazırlık: kabulden N baskı günü sonra (hafta sonu sayılır; biz baskıyı hafta sonu da yapıyoruz)
    const ready = new Date(acceptance);
    let added = 0;
    const target = Math.max(0, dispatchBusinessDays);
    while (added < target) {
      ready.setDate(ready.getDate() + 1);
      if (isProd(ready)) added++;
    }

    // Kargoya veriliş: hazır olduktan sonraki ilk kargo-çalışan gün (kargo hafta sonu çalışmaz → kayar)
    const ship = new Date(ready);
    while (!isBiz(ship)) ship.setDate(ship.getDate() + 1);

    const sameYMD = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const today0 = new Date(trNow); today0.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today0); tomorrow.setDate(tomorrow.getDate() + 1);

    const dateLong = ship.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
    const dayName = ship.toLocaleDateString("tr-TR", { weekday: "long" });
    const label = sameYMD(ship, today0)
      ? "bugün"
      : sameYMD(ship, tomorrow)
        ? `yarın (${dateLong} ${dayName})`
        : `${dayName} (${dateLong})`;

    setEst({ acceptedToday, cutoffHour, label });
  }, [cutoffHour, dispatchBusinessDays, extraHolidays]);

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
      <div className="text-sm">
        <p className="font-semibold text-text">Ne zaman kargoda?</p>
        {est ? (
          mode === "order" ? (
            <p className="text-text-light mt-0.5">
              Siparişiniz tahminen{" "}
              <span className="font-semibold text-primary">{est.label}</span> kargoya verilecek
            </p>
          ) : est.acceptedToday ? (
            <p className="text-text-light mt-0.5">
              Bugün saat <span className="font-semibold text-text">{String(est.cutoffHour).padStart(2, "0")}:00</span>&apos;a kadar sipariş ver →{" "}
              <span className="font-semibold text-primary">{est.label}</span> kargoda
            </p>
          ) : (
            <p className="text-text-light mt-0.5">
              Şimdi sipariş ver → <span className="font-semibold text-primary">{est.label}</span> kargoda
            </p>
          )
        ) : (
          <p className="text-text-light mt-0.5">Hesaplanıyor…</p>
        )}
      </div>
    </div>
  );
}
