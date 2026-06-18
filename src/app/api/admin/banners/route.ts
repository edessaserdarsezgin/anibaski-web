import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin.supabase
    .from("banners")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { text, url, bgColor, textColor, isActive, startAt, endAt } = await req.json();

  const { data, error } = await admin.supabase
    .from("banners")
    .insert({ text, url: url || null, bgColor: bgColor || "#6d55e8", textColor: textColor || "#ffffff", isActive: isActive ?? true, startAt: startAt || null, endAt: endAt || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, text, url, bgColor, textColor, isActive, startAt, endAt } = await req.json();

  const { error } = await admin.supabase
    .from("banners")
    .update({ text, url: url || null, bgColor: bgColor || "#6d55e8", textColor: textColor || "#ffffff", isActive, startAt: startAt || null, endAt: endAt || null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  const { error } = await admin.supabase.from("banners").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
