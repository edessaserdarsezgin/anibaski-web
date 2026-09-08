// Siparişin kargo desisi — MÜŞTERİ FİYATI DEĞİL, iç maliyet sinyali.
//
// Taşıyıcı 1 desinin altını da 1 desi ücretlendiriyor ve ürünlerimizin çoğu 1 desiyi
// geçmiyor; yani kargo maliyetimiz pratikte SABİT. Bu rozetin cevapladığı tek soru:
// "bu sipariş o sabit bandın dışına çıktı mı?" — çıktıysa sabit kargo ücreti orada
// zayıflamaya başlar. Bkz. DECISIONS.md "Kargo Fiyatlandırması".

import type { OrderDesiResult } from "@/lib/shipping/desi";

export default function OrderDesiBadge({ desi }: { desi: OrderDesiResult }) {
  // Hiçbir kalemin ölçüsü yoksa sayı uydurmak yerine eksiği söyle
  if (desi.tariffDesi === 0) {
    return (
      <p className="text-[11px] text-amber-700 mt-1">
        ⚠ Desi yok — {desi.missingCount} üründe paket ölçüsü girilmemiş
      </p>
    );
  }

  const overBand = desi.tariffDesi > 1;
  return (
    <p className={`text-[11px] mt-1 ${overBand ? "text-amber-700 font-semibold" : "text-text-light"}`}>
      Desi {desi.desi.toLocaleString("tr-TR")} → tarife {desi.tariffDesi}
      {overBand && " · sabit bandın üstünde"}
      {desi.missingCount > 0 && ` · ${desi.missingCount} üründe ölçü yok (eksik hesap)`}
    </p>
  );
}
