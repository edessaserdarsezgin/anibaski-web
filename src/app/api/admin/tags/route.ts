import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin.supabase
    .from("tags")
    .select("id, name, color, createdAt")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, color } = await req.json();

  const { data, error } = await admin.supabase
    .from("tags")
    .insert({ name: name.trim(), color: color || "#e07a5f" })
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

  const { id, name, color } = await req.json();

  const { error } = await admin.supabase
    .from("tags")
    .update({ name: name.trim(), color })
    .eq("id", id);

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
