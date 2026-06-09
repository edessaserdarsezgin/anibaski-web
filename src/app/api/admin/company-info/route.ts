import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { COMPANY_DEFAULTS } from "@/lib/company";
import { requireAdmin } from "@/lib/auth";
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data } = await supabase.from("company_info").select("data").eq("id", 1).single();
  return NextResponse.json({ ...COMPANY_DEFAULTS, ...((data?.data) ?? {}) });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const supabase = createAdminClient();
  const { error } = await supabase.from("company_info").upsert({ id: 1, data: body });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
