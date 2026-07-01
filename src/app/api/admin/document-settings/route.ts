import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { mergeMakbuzConfig } from "@/lib/documents";

// Şimdilik yalnızca 'makbuz' türü destekleniyor (mimari çok-tür için hazır).
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data } = await admin.supabase.from("document_settings").select("config").eq("type", "makbuz").maybeSingle();
  return NextResponse.json(mergeMakbuzConfig(data?.config));
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const config = mergeMakbuzConfig(body); // doğrulama + normalize

  const { error } = await admin.supabase
    .from("document_settings")
    .upsert({ type: "makbuz", config, updatedAt: new Date().toISOString() }, { onConflict: "type" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
