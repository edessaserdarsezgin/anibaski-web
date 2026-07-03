import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const { data, error } = await admin.supabase
    .from("collection_products")
    .select("product_id, position")
    .eq("collection_id", id)
    .order("position");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { items } = await req.json() as { items: { productId: string; position: number }[] };
  if (!Array.isArray(items)) return NextResponse.json({ error: "items gerekli" }, { status: 400 });

  const { error: delError } = await admin.supabase
    .from("collection_products")
    .delete()
    .eq("collection_id", id);

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  if (items.length > 0) {
    const rows = items.map((it) => ({ collection_id: id, product_id: it.productId, position: Number(it.position) || 0 }));
    const { error: insError } = await admin.supabase.from("collection_products").insert(rows);
    if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
  }

  revalidateTag("collections", "max");
  return NextResponse.json({ ok: true });
}
