import { NextResponse } from "next/server";
import { getShippingSettings } from "@/lib/shipping";

export async function GET() {
  const settings = await getShippingSettings();
  return NextResponse.json(settings);
}
