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
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("shipping_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return NextResponse.json({
      shippingFee: 49, freeShippingThreshold: 500, codFee: 30,
      productionTime: "2–3 iş günü", shippingTime: "1–3 iş günü",
      orderCutoffNote: "Siparişler hafta içi 14:00'a kadar verilirse aynı gün üretime alınır.",
    });
  }

  return NextResponse.json({
    shippingFee: Number(data.shipping_fee),
    freeShippingThreshold: Number(data.free_shipping_threshold),
    codFee: Number(data.cod_fee),
    productionTime: data.production_time?.trim() || "2–3 iş günü",
    shippingTime: data.shipping_time?.trim() || "1–3 iş günü",
    orderCutoffNote: data.order_cutoff_note?.trim() || "Siparişler hafta içi 14:00'a kadar verilirse aynı gün üretime alınır.",
  });
}

export async function PATCH(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { shippingFee, freeShippingThreshold, codFee, productionTime, shippingTime, orderCutoffNote } = body;

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("shipping_settings")
    .upsert({
      id: 1,
      shipping_fee: shippingFee,
      free_shipping_threshold: freeShippingThreshold,
      cod_fee: codFee,
      production_time: (typeof productionTime === "string" && productionTime.trim()) ? productionTime.trim() : null,
      shipping_time: (typeof shippingTime === "string" && shippingTime.trim()) ? shippingTime.trim() : null,
      order_cutoff_note: (typeof orderCutoffNote === "string" && orderCutoffNote.trim()) ? orderCutoffNote.trim() : null,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
