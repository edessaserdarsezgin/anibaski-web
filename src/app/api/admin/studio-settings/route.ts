import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return null;
  return user;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createAdminClient();
  const { data } = await db.from("studio_settings").select("*").eq("id", 1).single();
  return NextResponse.json(data ?? {
    daily_free: 3, trial_credits: 1, order_threshold: 1000, order_credit_amount: 10, expiry_days: 30, max_earned_balance: 50,
  });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  const db = createAdminClient();
  const { error } = await db.from("studio_settings").upsert({
    id: 1,
    daily_free: b.dailyFree,
    trial_credits: b.trialCredits,
    order_threshold: b.orderThreshold,
    order_credit_amount: b.orderCreditAmount,
    expiry_days: b.expiryDays,
    max_earned_balance: b.maxEarnedBalance,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
