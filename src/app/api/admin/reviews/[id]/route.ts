import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return p?.role === "ADMIN" ? user : null;
}

// PATCH — onayla / gizle
export async function PATCH(req: NextRequest, { params }: Props) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  const { id } = await params;
  const { isApproved } = await req.json() as { isApproved: boolean };
  const { error } = await createAdminClient()
    .from("product_reviews")
    .update({ isApproved })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — kalıcı sil
export async function DELETE(_req: NextRequest, { params }: Props) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  const { id } = await params;
  const { error } = await createAdminClient()
    .from("product_reviews")
    .delete()
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
