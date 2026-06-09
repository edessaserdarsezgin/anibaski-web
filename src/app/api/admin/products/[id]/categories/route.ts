import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { data, error } = await admin.supabase
    .from("product_categories")
    .select("categoryId")
    .eq("productId", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r) => r.categoryId));
}

export async function PUT(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { categoryIds } = await req.json() as { categoryIds: string[] };

  const { error: delError } = await admin.supabase
    .from("product_categories").delete().eq("productId", id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  const clean = Array.from(new Set((categoryIds ?? []).filter(Boolean)));
  if (clean.length > 0) {
    const rows = clean.map((categoryId) => ({ productId: id, categoryId }));
    const { error: insError } = await admin.supabase.from("product_categories").insert(rows);
    if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
