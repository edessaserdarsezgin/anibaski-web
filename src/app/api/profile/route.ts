import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fullName, phone, notify_delivery_contact, marketing_consent } = await req.json();

  if (!phone || !phone.trim()) {
    return NextResponse.json({ error: "Telefon numarası zorunludur." }, { status: 400 });
  }

  // Mevcut telefonu kontrol et — değişmişse phone_verified resetlensin
  const { data: current } = await supabase
    .from("profiles").select("phone").eq("id", user.id).single();

  const updates: Record<string, unknown> = {
    fullName: fullName || null,
    phone: phone.trim(),
  };
  if (typeof notify_delivery_contact === "boolean") {
    updates.notify_delivery_contact = notify_delivery_contact;
  }
  if (typeof marketing_consent === "boolean") {
    updates.marketing_consent = marketing_consent;
  }
  if (current?.phone !== phone.trim()) {
    updates.phone_verified = false;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
