import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 6);

  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, images, basePrice, category:categories!products_categoryId_fkey(name, slug)")
    .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    .eq("isActive", true)
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ results: data ?? [] });
}
