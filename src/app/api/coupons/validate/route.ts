import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, subtotal } = await req.json();
  if (!code?.trim()) return NextResponse.json({ error: "Kupon kodu gerekli" }, { status: 400 });

  // coupons RLS-korumalı → admin-client ile oku (anon/user erişimi yok)
  const { data: coupon } = await createAdminClient()
    .from("coupons")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .single();

  if (!coupon) return NextResponse.json({ error: "Geçersiz veya kullanılmış kupon kodu." }, { status: 404 });

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ error: "Bu kuponun süresi dolmuş." }, { status: 400 });
  }

  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({ error: "Bu kupon kullanım limitine ulaşmış." }, { status: 400 });
  }

  if (coupon.min_order_amount && subtotal < Number(coupon.min_order_amount)) {
    return NextResponse.json({
      error: `Bu kupon için minimum sipariş tutarı ${Number(coupon.min_order_amount).toLocaleString("tr-TR")} ₺.`,
    }, { status: 400 });
  }

  const discountAmount = coupon.discount_type === "percentage"
    ? Math.round(subtotal * (Number(coupon.discount_value) / 100) * 100) / 100
    : Math.min(Number(coupon.discount_value), subtotal);

  return NextResponse.json({
    code: coupon.code,
    discountType: coupon.discount_type,
    discountValue: Number(coupon.discount_value),
    discountAmount,
  });
}
