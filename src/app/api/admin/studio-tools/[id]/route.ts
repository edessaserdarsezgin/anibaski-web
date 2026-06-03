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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json();

  // Yalnız gönderilen alanları güncelle (toggle için { active } yeterli).
  const patch: Record<string, unknown> = {};
  if (typeof b.name === "string") patch.name = b.name.trim();
  if (typeof b.description === "string") patch.description = b.description;
  if (typeof b.icon === "string" && b.icon) patch.icon = b.icon;
  if ("engine" in b) patch.engine = b.engine === "upscale" || b.engine === "edit" ? b.engine : null;
  if ("lora" in b) patch.lora = typeof b.lora === "string" && b.lora ? b.lora : null;
  if ("prompt" in b) patch.prompt = typeof b.prompt === "string" && b.prompt ? b.prompt : null;
  if ("generative" in b) patch.generative = !!b.generative;
  if ("active" in b) patch.active = !!b.active;
  if (typeof b.sortOrder === "number") patch.sort_order = b.sortOrder;

  const db = createAdminClient();
  const { error } = await db.from("studio_tools").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(await getStudioTools());
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = createAdminClient();
  const { error } = await db.from("studio_tools").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(await getStudioTools());
}
