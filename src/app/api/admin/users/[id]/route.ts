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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: caller } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (caller?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  if (id === user.id) {
    return NextResponse.json({ error: "Kendi hesabınızı silemezsiniz." }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Sipariş varsa silmeye izin verme (muhasebe/yasal gereklilik)
  const { count: orderCount } = await adminClient
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("userId", id);

  if ((orderCount ?? 0) > 0) {
    return NextResponse.json(
      { error: `Bu üyenin ${orderCount} siparişi var. Sipariş kaydı bulunan üye silinemez.` },
      { status: 400 }
    );
  }

  // 1. Profili sil (CASCADE: addresses + cart_items + favorites + phone_verifications)
  const { error: profileErr } = await adminClient.from("profiles").delete().eq("id", id);
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });

  // 2. auth.users kaydını sil
  const { error: authErr } = await adminClient.auth.admin.deleteUser(id);
  if (authErr) {
    console.error("[admin/users] auth silinemedi (profil silindi):", authErr);
    return NextResponse.json({ error: "Profil silindi ama auth kaydı temizlenemedi: " + authErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
