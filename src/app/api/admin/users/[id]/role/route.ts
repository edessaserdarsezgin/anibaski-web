import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: caller } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (caller?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { role } = await req.json();
  if (!["ADMIN", "CUSTOMER"].includes(role)) {
    return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
  }

  // Admin kendini CUSTOMER yapamasın (yanlışlıkla yetkiyi kaybetmesin)
  if (id === user.id && role !== "ADMIN") {
    return NextResponse.json({ error: "Kendi rolünüzü değiştiremezsiniz." }, { status: 400 });
  }

  const { error } = await createAdminClient().from("profiles").update({ role }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
