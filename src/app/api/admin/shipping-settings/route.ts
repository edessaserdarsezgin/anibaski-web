import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      dispatchCutoffHour: 14, dispatchBusinessDays: 1,
    });
  }

  return NextResponse.json({
    shippingFee: Number(data.shipping_fee),
    freeShippingThreshold: Number(data.free_shipping_threshold),
    codFee: Number(data.cod_fee),
    productionTime: data.production_time?.trim() || "2–3 iş günü",
    shippingTime: data.shipping_time?.trim() || "1–3 iş günü",
    orderCutoffNote: data.order_cutoff_note?.trim() || "Siparişler hafta içi 14:00'a kadar verilirse aynı gün üretime alınır.",
    dispatchCutoffHour: data.dispatch_cutoff_hour ?? 14,
    dispatchBusinessDays: data.dispatch_business_days ?? 1,
  });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { shippingFee, freeShippingThreshold, codFee, productionTime, shippingTime, orderCutoffNote, dispatchCutoffHour, dispatchBusinessDays } = body;

  // cutoff saat 0–23, iş günü 1–10 ile sınırla (geçersiz girdi takvim hesabını bozmasın)
  const cutoffHour = Math.min(23, Math.max(0, Math.floor(Number(dispatchCutoffHour))));
  const bizDays = Math.min(10, Math.max(1, Math.floor(Number(dispatchBusinessDays))));

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
      dispatch_cutoff_hour: Number.isFinite(cutoffHour) ? cutoffHour : 14,
      dispatch_business_days: Number.isFinite(bizDays) ? bizDays : 1,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  revalidateTag("shipping", "max");
  return NextResponse.json({ ok: true });
}
