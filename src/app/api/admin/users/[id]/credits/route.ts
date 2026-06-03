import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCreditStatus, adjustCredits } from "@/lib/studioCredits";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "ADMIN" ? user : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  return NextResponse.json(await getCreditStatus(id));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { delta, note } = await req.json();
  if (typeof delta !== "number" || delta === 0) {
    return NextResponse.json({ error: "Geçersiz miktar" }, { status: 400 });
  }
  await adjustCredits(id, delta, typeof note === "string" ? note : undefined);
  return NextResponse.json(await getCreditStatus(id));
}
