import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCoupon } from "@/lib/promotions";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, items } = (await req.json()) as {
    code?: string;
    items?: { productId: string; categoryId: string | null; unitPrice: number; quantity: number }[];
  };
  if (!code?.trim()) return NextResponse.json({ error: "Kupon kodu gerekli" }, { status: 400 });

  const list = items ?? [];
  const subtotal = list.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const res = await validateCoupon(code, list, subtotal, user.id);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  return NextResponse.json({ code: res.promo.code, discountAmount: res.amount });
}
