import { NextResponse } from "next/server";
import { getSettings } from "@/lib/studioCredits";

// AI Stüdyo kredi eşiği + miktarı — sepet barı ve stüdyo mesajı için public (hassas değil).
export async function GET() {
  const s = await getSettings();
  return NextResponse.json({
    orderThreshold: s.orderThreshold,
    orderCreditAmount: s.orderCreditAmount,
  });
}
