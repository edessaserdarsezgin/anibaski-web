import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fullName, phone, landline, notify_delivery_contact, marketing_consent } = await req.json();

  if (!phone || !phone.trim()) {
    return NextResponse.json({ error: "Telefon numarası zorunludur." }, { status: 400 });
  }

  // Mevcut telefonu kontrol et — değişmişse phone_verified resetlensin
  const { data: current } = await supabase
    .from("profiles").select("phone").eq("id", user.id).single();

  // Telefon değiştiyse başka hesapta kayıtlı mı kontrol et
  if (normalizePhone(current?.phone) !== normalizePhone(phone)) {
    const admin = createAdminClient();
    const { data: inUse, error: rpcErr } = await admin.rpc("phone_in_use", {
      p_norm: normalizePhone(phone),
      p_exclude: user.id,
    });
    if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    if (inUse) {
      return NextResponse.json(
        { error: "Bu telefon numarası başka bir hesapta kayıtlı." },
        { status: 409 }
      );
    }
  }

  const updates: Record<string, unknown> = {
    fullName: fullName || null,
    phone: phone.trim(),
    landline: (typeof landline === "string" && landline.trim()) ? landline.trim() : null,
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

  if (error) {
    console.error("[profile] güncelleme hatası:", error);
    return NextResponse.json({ error: "Profil güncellenemedi" }, { status: 500 });
  }
  return NextResponse.json(data);
}
