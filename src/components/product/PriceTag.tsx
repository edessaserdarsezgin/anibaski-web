// src/components/product/PriceTag.tsx — liste/detayda indirimli fiyat gösterimi.
import { activeDiscountPercent, applyDiscount, type DiscountFields } from "@/lib/pricing";

type Props = { basePrice: number; discount: DiscountFields; salePrice?: number | null; suffix?: string };

export default function PriceTag({ basePrice, discount, salePrice, suffix }: Props) {
  const pct = activeDiscountPercent(discount);
  if (pct <= 0 && !salePrice) {
    return (
      <span className="font-serif text-lg font-semibold text-primary">
        {Number(basePrice).toLocaleString("tr-TR")} ₺
        {suffix && <span className="text-xs font-sans font-normal text-text-light ml-1">{suffix}</span>}
      </span>
    );
  }
  // salePrice: sabit tutarlı promosyondan gelen kesin fiyat (yüzde yuvarlama hatası yok)
  const final = salePrice ?? applyDiscount(Number(basePrice), pct);
  const badgePct = salePrice
    ? Math.round((1 - salePrice / Number(basePrice)) * 100)
    : pct;
  return (
    <span className="flex items-center gap-2 flex-wrap">
      <span className="line-through text-text-light text-sm">{Number(basePrice).toLocaleString("tr-TR")} ₺</span>
      <span className="font-serif text-lg font-semibold text-primary">
        {final.toLocaleString("tr-TR")} ₺
        {suffix && <span className="text-xs font-sans font-normal text-text-light ml-1">{suffix}</span>}
      </span>
      <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">%{badgePct}</span>
    </span>
  );
}
