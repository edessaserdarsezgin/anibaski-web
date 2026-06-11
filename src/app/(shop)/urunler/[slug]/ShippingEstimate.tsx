"use client";

import { useEffect, useState } from "react";

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
}: {
  cutoffHour?: number;
  dispatchBusinessDays?: number;
}) {
  const [est, setEst] = useState<Estimate | null>(null);

  useEffect(() => {
    // TR duvar saatini al (kullanıcının cihaz saat dilimi ne olursa olsun)
    const trNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
    const isBiz = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6;

    const acceptedToday = isBiz(trNow) && trNow.getHours() < cutoffHour;

    // Kabul günü: bugün (hafta içi + cutoff öncesi) ya da bir sonraki iş günü
    const acceptance = new Date(trNow);
    acceptance.setHours(0, 0, 0, 0);
    if (!acceptedToday) {
      do { acceptance.setDate(acceptance.getDate() + 1); } while (!isBiz(acceptance));
    }

    // Kargoya veriliş: kabul gününden N iş günü sonra
    const ship = new Date(acceptance);
    let added = 0;
    const target = Math.max(1, dispatchBusinessDays);
    while (added < target) {
      ship.setDate(ship.getDate() + 1);
      if (isBiz(ship)) added++;
    }

    const tomorrow = new Date(trNow);
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      ship.getFullYear() === tomorrow.getFullYear() &&
      ship.getMonth() === tomorrow.getMonth() &&
      ship.getDate() === tomorrow.getDate();

    const dateLong = ship.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
    const dayName = ship.toLocaleDateString("tr-TR", { weekday: "long" });
    const label = isTomorrow ? `yarın (${dateLong} ${dayName})` : `${dayName} (${dateLong})`;

    setEst({ acceptedToday, cutoffHour, label });
  }, [cutoffHour, dispatchBusinessDays]);

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
      <div className="text-sm">
        <p className="font-semibold text-text">Ne zaman kargoda?</p>
        {est ? (
          est.acceptedToday ? (
            <p className="text-text-light mt-0.5">
              Bugün <span className="font-semibold text-text">{String(est.cutoffHour).padStart(2, "0")}:00</span>&apos;dan önce sipariş ver →{" "}
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
