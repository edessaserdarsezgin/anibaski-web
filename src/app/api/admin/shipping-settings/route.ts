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
      dispatchCutoffHour: 14, dispatchBusinessDays: 0,
      ramazanStart: "", ramazanEnd: "", kurbanStart: "", kurbanEnd: "", extraHolidays: "",
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
    dispatchBusinessDays: data.dispatch_business_days ?? 0,
    ramazanStart: data.ramazan_start ?? "",
    ramazanEnd: data.ramazan_end ?? "",
    kurbanStart: data.kurban_start ?? "",
    kurbanEnd: data.kurban_end ?? "",
    extraHolidays: data.extra_holidays?.trim() || "",
  });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { shippingFee, freeShippingThreshold, codFee, productionTime, shippingTime, orderCutoffNote, dispatchCutoffHour, dispatchBusinessDays, ramazanStart, ramazanEnd, kurbanStart, kurbanEnd, extraHolidays } = body;

  // cutoff saat 0–23, iş günü 0–10 ile sınırla (0 = aynı gün; geçersiz girdi takvim hesabını bozmasın)
  const cutoffHour = Math.min(23, Math.max(0, Math.floor(Number(dispatchCutoffHour))));
  const bizDays = Math.min(10, Math.max(0, Math.floor(Number(dispatchBusinessDays))));

  // Bayram tarihleri: yalnız geçerli YYYY-MM-DD, değilse null
  const asDate = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

  // Diğer özel tatiller: yalnız geçerli YYYY-MM-DD satırları, sıralı + tekil
  const cleanedHolidays = typeof extraHolidays === "string"
    ? Array.from(new Set(
        extraHolidays.split(/[\n,;]+/).map((s: string) => s.trim()).filter((s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s))
      )).sort().join("\n")
    : "";

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
      dispatch_business_days: Number.isFinite(bizDays) ? bizDays : 0,
      ramazan_start: asDate(ramazanStart),
      ramazan_end: asDate(ramazanEnd),
      kurban_start: asDate(kurbanStart),
      kurban_end: asDate(kurbanEnd),
      extra_holidays: cleanedHolidays || null,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  revalidateTag("shipping", "max");
  return NextResponse.json({ ok: true });
}
