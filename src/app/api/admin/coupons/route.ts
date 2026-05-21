import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "ADMIN") return null;
  return { supabase: createAdminClient() };
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data } = await admin.supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt } = body;

  if (!code?.trim() || !discountType || !discountValue) {
    return NextResponse.json({ error: "Kod, tür ve değer zorunlu" }, { status: 400 });
  }

  const { data, error } = await admin.supabase
    .from("coupons")
    .insert({
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_order_amount: minOrderAmount ? Number(minOrderAmount) : null,
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expiresAt || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
