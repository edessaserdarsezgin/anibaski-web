import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveAddressLocation } from "@/lib/shipping/addressLocation";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("addresses")
    .select("*")
    .eq("userId", user.id)
    .order("title", { ascending: true });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, fullName, phone, address, city, district, zip, cityCode } = body;
  // İl/ilçe sunucuda doğrulanır — istemci seçim kutusu kullansa da ona güvenilmez.
  const loc = resolveAddressLocation({ city, cityCode, district });
  if (!loc.ok) return NextResponse.json({ error: loc.error }, { status: 400 });

  const { data, error } = await supabase
    .from("addresses")
    .insert({ userId: user.id, title, fullName, phone, address, city, district: loc.district, zip: zip || null, city_code: loc.city_code })
    .select()
    .single();

  if (error) {
    console.error("[addresses] kayıt hatası:", error);
    return NextResponse.json({ error: "Adres kaydedilemedi" }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
