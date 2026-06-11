import { NextResponse } from "next/server";
import { getActiveCartAutoPromotions, getDiscountStacking } from "@/lib/promotions";

// Public: aktif sepet eşikli (cart-auto) indirimler + çakışma modu — sepet/ödeme gösterimi için.
// (Item indirimleri zaten ürün kartı/fiyatına yansır; kuponlar koddan doğrulanır.)
export async function GET() {
  const [cartAutos, stacking] = await Promise.all([getActiveCartAutoPromotions(), getDiscountStacking()]);
  return NextResponse.json({ cartAutos, stacking });
}
