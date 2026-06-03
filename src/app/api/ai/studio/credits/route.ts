import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCreditStatus } from "@/lib/studioCredits";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const status = await getCreditStatus(user.id);
  return NextResponse.json(status);
}
