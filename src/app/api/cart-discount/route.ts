import { NextResponse } from "next/server";
import { getCartDiscountTiers } from "@/lib/cartDiscount";

// Public: aktif sepet indirimi kademeleri (sepet/ödeme ekranında gösterim için).
export async function GET() {
  const tiers = await getCartDiscountTiers();
  return NextResponse.json({ tiers });
}
