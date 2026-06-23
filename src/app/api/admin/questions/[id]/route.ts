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

// PATCH — cevap yaz veya görünürlük değiştir
export async function PATCH(req: NextRequest, { params }: Props) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  const { id } = await params;
  const body = await req.json() as { answer?: string; isVisible?: boolean };
  const update: Record<string, unknown> = {};
  if (typeof body.isVisible === "boolean") update.isVisible = body.isVisible;
  if (typeof body.answer === "string") {
    update.answer = body.answer.trim() || null;
    update.answeredAt = body.answer.trim() ? new Date().toISOString() : null;
  }
  const { error } = await createAdminClient()
    .from("product_questions")
    .update(update)
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE
export async function DELETE(_req: NextRequest, { params }: Props) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  const { id } = await params;
  const { error } = await createAdminClient()
    .from("product_questions")
    .delete()
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
