import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let tool = "upscale";
  try {
    const body = await req.json();
    if (typeof body?.tool === "string") tool = body.tool;
  } catch {
    // gövde yoksa varsayılan tool
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminDb = createAdminClient();
  await adminDb.from("studio_jobs").insert({ userId: user?.id ?? null, tool });

  return NextResponse.json({ ok: true });
}
