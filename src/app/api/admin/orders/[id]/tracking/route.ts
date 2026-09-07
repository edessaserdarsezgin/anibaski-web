import { NextRequest, NextResponse } from "next/server";
import { sendShippingNotification } from "@/lib/email/shippingNotification";
import { notifyShippingUpdate } from "@/lib/whatsapp/notify";
import { requireAdmin } from "@/lib/auth";
import { recordShipment, type DispatchDeps } from "@/lib/shipping/dispatch";
import { isKnownCarrier } from "@/lib/shipping/carrier/registry";
import { CarrierError } from "@/lib/shipping/carrier/provider";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { trackingCode, carrier } = await req.json();

  // Geriye dönük uyum: taşıyıcı gönderilmezse "other" — eski istemci kırılmaz,
  // yalnız takip linki üretilmez.
  const carrierId = typeof carrier === "string" && isKnownCarrier(carrier) ? carrier : "other";

  try {
    await recordShipment(
      {
        supabase: admin.supabase as unknown as DispatchDeps["supabase"],
        sendEmail: (p) =>
          sendShippingNotification({
            orderId: p.orderId,
            customerEmail: p.customerEmail,
            customerName: p.customerName,
            trackingCode: p.trackingCode,
            carrierName: p.carrierName,
            trackingUrl: p.trackingUrl,
          }),
        sendWhatsApp: (p) =>
          notifyShippingUpdate({
            phone: p.phone,
            orderNo: p.orderNo,
            trackingCode: p.trackingCode,
            trackingUrl: p.trackingUrl,
          }),
      },
      id,
      { carrier: carrierId, trackingCode: String(trackingCode ?? ""), shipmentId: null, labelUrl: null },
    );
  } catch (e) {
    if (e instanceof CarrierError) {
      return NextResponse.json({ error: e.message }, { status: e.code === "VALIDATION" ? 400 : 500 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
