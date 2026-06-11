import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag } from "next/cache";

// Admin: ana aç/kapa + tüm kademeler (aktif/pasif dahil) yönetimi.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [{ data: config }, { data: tiers }] = await Promise.all([
    admin.supabase.from("cart_discount_config").select("enabled").eq("id", 1).single(),
    admin.supabase.from("cart_discount_tiers").select("*").order("min_subtotal", { ascending: true }),
  ]);

  return NextResponse.json({ enabled: config?.enabled ?? true, tiers: tiers ?? [] });
}

// Yeni kademe oluştur
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { minSubtotal, discountType, discountValue } = await req.json();
  if (!(Number(minSubtotal) > 0) || !(Number(discountValue) > 0) || (discountType !== "percentage" && discountType !== "fixed")) {
    return NextResponse.json({ error: "Eşik, tür ve değer geçerli olmalı." }, { status: 400 });
  }
  if (discountType === "percentage" && Number(discountValue) > 99) {
    return NextResponse.json({ error: "Yüzde indirim 1–99 arası olmalı." }, { status: 400 });
  }

  const { error } = await admin.supabase.from("cart_discount_tiers").insert({
    min_subtotal: Number(minSubtotal),
    discount_type: discountType,
    discount_value: Number(discountValue),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag("cart-discount", "max");
  return NextResponse.json({ ok: true });
}

// Ana aç/kapa
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { enabled } = await req.json();
  const { error } = await admin.supabase
    .from("cart_discount_config")
    .upsert({ id: 1, enabled: !!enabled });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag("cart-discount", "max");
  return NextResponse.json({ ok: true });
}
