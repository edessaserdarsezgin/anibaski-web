import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin.supabase
    .from("tags")
    .select("id, name, color, text_color, is_active, createdAt")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, color, text_color } = await req.json();

  const { data, error } = await admin.supabase
    .from("tags")
    .insert({ name: name.trim(), color: color || "#e07a5f", text_color: text_color || "#ffffff" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  revalidateTag("tags", "max");
  revalidateTag("products", "max");
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, name, color, text_color, is_active } = await req.json();

  // Sadece gönderilen alanları güncelle (aktif/pasif düğmesi yalnız is_active gönderir)
  const patch: Record<string, unknown> = {};
  if (name !== undefined) patch.name = name.trim();
  if (color !== undefined) patch.color = color;
  if (text_color !== undefined) patch.text_color = text_color;
  if (is_active !== undefined) patch.is_active = !!is_active;

  const { error } = await admin.supabase.from("tags").update(patch).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag("tags", "max");
  revalidateTag("products", "max");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();

  const { error } = await admin.supabase.from("tags").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  revalidateTag("tags", "max");
  revalidateTag("products", "max");
  return NextResponse.json({ ok: true });
}
