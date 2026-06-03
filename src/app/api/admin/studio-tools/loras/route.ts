import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEditLoras } from "@/lib/aiEdit";

// Admin formundaki LoRA dropdown'u — Space'in canlı adaptör listesi.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return NextResponse.json(await getEditLoras());
  } catch {
    return NextResponse.json([]);
  }
}
