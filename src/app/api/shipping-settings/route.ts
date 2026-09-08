import { NextResponse } from "next/server";
import { getShippingSettings } from "@/lib/shipping";

export async function GET() {
  try {
    const settings = await getShippingSettings();
    return NextResponse.json(settings);
  } catch {
    // Yedek değer dönmüyoruz: istemci yanlış kargo ücreti göstermektense hiç göstermesin
    return NextResponse.json({ error: "Kargo ayarları okunamadı" }, { status: 503 });
  }
}
