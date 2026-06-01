import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "ADMIN") return null;
  return { supabase: createAdminClient() };
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const { data, error } = await admin.supabase
    .from("product_tags")
    .select("tagId, position, tag:tags(name, color)")
    .eq("productId", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { tags } = await req.json() as { tags: { tagId: string; position: string }[] };

  const { error: delError } = await admin.supabase
    .from("product_tags")
    .delete()
    .eq("productId", id);

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  if (tags && tags.length > 0) {
    const rows = tags.map(t => ({ productId: id, tagId: t.tagId, position: t.position }));
    const { error: insError } = await admin.supabase.from("product_tags").insert(rows);
    if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
