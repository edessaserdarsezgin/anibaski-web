import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin.supabase
    .from("categories")
    .select("id, name, slug, description, parentId, show_on_home, home_position")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, slug, description, parentId } = await req.json();

  const { data, error } = await admin.supabase
    .from("categories")
    .insert({ name, slug, description: description || null, parentId: parentId || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, name, slug, description, parentId, show_on_home, home_position } = await req.json();

  const { error } = await admin.supabase
    .from("categories")
    .update({ name, slug, description: description || null, parentId: parentId || null, show_on_home: !!show_on_home, home_position: Number.isFinite(Number(home_position)) ? Number(home_position) : 0 })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();

  const { error } = await admin.supabase.from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
