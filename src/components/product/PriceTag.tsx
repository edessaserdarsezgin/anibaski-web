// src/components/product/PriceTag.tsx — liste/detayda indirimli fiyat gösterimi.
import { activeDiscountPercent, applyDiscount, type DiscountFields } from "@/lib/pricing";

type Props = { basePrice: number; discount: DiscountFields; suffix?: string };

export default function PriceTag({ basePrice, discount, suffix }: Props) {
  const pct = activeDiscountPercent(discount);
  if (pct <= 0) {
    return (
      <span className="font-serif text-lg font-semibold text-primary">
        {Number(basePrice).toLocaleString("tr-TR")} ₺
        {suffix && <span className="text-xs font-sans font-normal text-text-light ml-1">{suffix}</span>}
      </span>
    );
  }
  const final = applyDiscount(Number(basePrice), pct);
  return (
    <span className="flex items-center gap-2 flex-wrap">
      <span className="line-through text-text-light text-sm">{Number(basePrice).toLocaleString("tr-TR")} ₺</span>
      <span className="font-serif text-lg font-semibold text-primary">
        {final.toLocaleString("tr-TR")} ₺
        {suffix && <span className="text-xs font-sans font-normal text-text-light ml-1">{suffix}</span>}
      </span>
      <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">%{pct}</span>
    </span>
  );
}
