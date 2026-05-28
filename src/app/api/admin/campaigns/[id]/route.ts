import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const, status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return { error: "Forbidden" as const, status: 403 };
  return { ok: true as const };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  ["title", "slug", "subtitle", "description", "image_url", "cta_text", "cta_url", "coupon_code", "starts_at", "ends_at", "position"].forEach((key) => {
    if (key in body) updates[key] = body[key];
  });
  if ("is_active" in body) updates.is_active = body.is_active;
  updates.updated_at = new Date().toISOString();

  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
  }

  const { error } = await createAdminClient().from("campaigns").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await params;
  const { error } = await createAdminClient().from("campaigns").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
