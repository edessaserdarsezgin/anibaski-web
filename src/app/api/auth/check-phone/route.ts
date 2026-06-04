import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  const norm = normalizePhone(phone);
  if (norm.length < 10) return NextResponse.json({ available: true });

  const db = createAdminClient();
  const { data, error } = await db.rpc("phone_in_use", { p_norm: norm, p_exclude: null });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ available: !data });
}
