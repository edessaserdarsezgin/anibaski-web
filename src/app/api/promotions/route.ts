import { NextResponse } from "next/server";
import { getActiveCartAutoPromotions } from "@/lib/promotions";

// Public: aktif sepet eşikli (cart-auto) indirimler — sepet/ödeme gösterimi + nudge için.
// (Item indirimleri zaten ürün kartı/fiyatına yansır; kuponlar koddan doğrulanır.)
export async function GET() {
  const cartAutos = await getActiveCartAutoPromotions();
  return NextResponse.json({ cartAutos });
}
