import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return p?.role === "ADMIN";
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  const { data } = await createAdminClient()
    .from("product_questions")
    .select(`id, question, answer, "isVisible", "answeredAt", "createdAt",
      product:products!product_questions_productId_fkey(name, slug),
      profile:profiles!product_questions_userId_fkey("fullName", email)`)
    .order("createdAt", { ascending: false });
  return NextResponse.json(data ?? []);
}
