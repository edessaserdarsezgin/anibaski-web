import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notifyCancelRequested, notifyAdminCancelRequest } from "@/lib/whatsapp/notify";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: order } = await supabase
    .from("orders")
    .select('"userId", "addressId", status')
    .eq("id", id)
    .single();

  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  }
  if (order.status !== "PENDING") {
    return NextResponse.json({ error: "Yalnızca beklemedeki siparişler iptal edilebilir" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("orders").update({ status: "CANCEL_REQUESTED" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Müşteriye bildirim
  const [{ data: profile }, { data: address }] = await Promise.all([
    adminClient.from("profiles").select('phone, "fullName"').eq("id", user.id).single(),
    adminClient.from("addresses").select("phone").eq("id", order.addressId).single(),
  ]);

  const phone = profile?.phone || address?.phone;
  const orderNo = id.slice(0, 8).toUpperCase();

  if (phone) notifyCancelRequested({ phone, orderNo });
  notifyAdminCancelRequest({ orderNo, customerName: profile?.fullName ?? "Müşteri" });

  return NextResponse.json({ ok: true });
}
