import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const { title, fullName, phone, address, city, district, zip } = body;

  const { data, error } = await supabase
    .from("addresses")
    .insert({ userId: user.id, title, fullName, phone, address, city, district, zip: zip || null })
    .select()
    .single();

  if (error) {
    console.error("[addresses] kayıt hatası:", error);
    return NextResponse.json({ error: "Adres kaydedilemedi" }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
