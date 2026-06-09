import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  // PostgREST .or() filter injection'a karşı: virgül/parantez/operatör karakterlerini temizle
  const q = raw.replace(/[,()%:*\\]/g, " ").trim();
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 6);

  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, images, basePrice, category:categories!products_categoryId_fkey(name, slug)")
    .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    .eq("isActive", true)
    .limit(limit);

  if (error) {
    console.error("[search] hata:", error);
    return NextResponse.json({ error: "Arama başarısız" }, { status: 500 });
  }

  return NextResponse.json({ results: data ?? [] });
}
