import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: caller } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (caller?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { fullName, phone, role, notify_delivery_contact } = body;

  if (role && !["ADMIN", "CUSTOMER"].includes(role)) {
    return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
  }
  // Admin kendini CUSTOMER yapamasın
  if (id === user.id && role && role !== "ADMIN") {
    return NextResponse.json({ error: "Kendi rolünüzü değiştiremezsiniz." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof fullName === "string") updates.fullName = fullName.trim() || null;
  if (typeof phone === "string") updates.phone = phone.trim() || null;
  if (role) updates.role = role;
  if (typeof notify_delivery_contact === "boolean") updates.notify_delivery_contact = notify_delivery_contact;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
  }

  const { error } = await createAdminClient().from("profiles").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
