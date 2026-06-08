import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Sepet çapraz satış önerileri — aktif ürünlerden bir kısmı (yeni eklenenler).
export async function GET() {
  const db = createAdminClient();
  const { data } = await db
    .from("products")
    .select("id, name, slug, basePrice, images, discount_percent, discount_starts_at, discount_ends_at")
    .eq("isActive", true)
    .order("createdAt", { ascending: false })
    .limit(12);

  return NextResponse.json({ products: data ?? [] });
}
