import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getStudioTools } from "@/lib/studioTools";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "ADMIN" ? user : null;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getStudioTools());
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (typeof b.slug !== "string" || !b.slug.trim() || typeof b.name !== "string" || !b.name.trim()) {
    return NextResponse.json({ error: "Slug ve ad zorunlu" }, { status: 400 });
  }
  const db = createAdminClient();
  const { error } = await db.from("studio_tools").insert({
    slug: b.slug.trim(),
    name: b.name.trim(),
    description: typeof b.description === "string" ? b.description : "",
    icon: typeof b.icon === "string" && b.icon ? b.icon : "✨",
    engine: b.engine === "upscale" || b.engine === "edit" ? b.engine : null,
    lora: typeof b.lora === "string" && b.lora ? b.lora : null,
    prompt: typeof b.prompt === "string" && b.prompt ? b.prompt : null,
    generative: !!b.generative,
    active: !!b.active,
    sort_order: typeof b.sortOrder === "number" ? b.sortOrder : 0,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(await getStudioTools());
}
