import { NextRequest, NextResponse } from "next/server";
import { notifyStatusUpdate, notifyCancelApproved, notifyCancelRejected } from "@/lib/whatsapp/notify";
import { requireAdmin } from "@/lib/auth";
import { deleteFromR2 } from "@/lib/r2";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json();

  // SHIPPED yalnızca tracking endpoint'inden set edilir
  const validStatuses = ["PENDING", "PREPARING", "DELIVERED", "CANCELLED", "CANCEL_REQUESTED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Geçişi belirlemek için mevcut durumu al
  const { data: current } = await admin.supabase
    .from("orders")
    .select('"userId", "addressId", "trackingCode", status')
    .eq("id", id)
    .single();

  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const prevStatus = current.status;

  const patch: { status: string; deliveredAt?: string; photosPurgedAt?: string } =
    status === "DELIVERED" && prevStatus !== "DELIVERED"
      ? { status, deliveredAt: new Date().toISOString() }
      : { status };

  const { data: order, error } = await admin.supabase
    .from("orders")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // PREPARING'e geçince fotoğrafları R2'den sil — admin indirdi, artık gerekmez.
  if (status === "PREPARING" && prevStatus !== "PREPARING") {
    const { data: items } = await admin.supabase
      .from("order_items")
      .select("uploadedImages")
      .eq("orderId", id);
    const paths = (items ?? []).flatMap((it) => (it.uploadedImages as string[] | null) ?? []);
    deleteFromR2(paths).catch((e) => console.error("[upload-purge] R2 sil hatası:", e));
    admin.supabase.from("orders").update({ photosPurgedAt: new Date().toISOString() }).eq("id", id).then(() => {});
  }

  // WhatsApp bildirimi — tamamen fire-and-forget, response'u bloke etmez
  const notifyStatuses = ["PREPARING", "DELIVERED", "CANCELLED", "CANCEL_REQUESTED"];
  if (current.userId && notifyStatuses.includes(status)) {
    const userId = current.userId;
    const addressId = current.addressId;
    const orderNo = id.slice(0, 8).toUpperCase();
    Promise.all([
      admin.supabase.from("profiles").select("phone").eq("id", userId).single(),
      admin.supabase.from("addresses").select("phone").eq("id", addressId).single(),
    ]).then(([{ data: profile }, { data: address }]) => {
      const phone = profile?.phone || address?.phone;
      if (!phone) return;
      if (prevStatus === "CANCEL_REQUESTED" && status === "CANCELLED") {
        notifyCancelApproved({ phone, orderNo });
      } else if (prevStatus === "CANCEL_REQUESTED" && status !== "CANCELLED") {
        notifyCancelRejected({ phone, orderNo });
      } else if (["PREPARING", "DELIVERED", "CANCELLED"].includes(status)) {
        notifyStatusUpdate({ phone, orderNo, status: status as "PREPARING" | "DELIVERED" | "CANCELLED" });
      }
    }).catch((e) => console.error("[notify] WP bildirim hatası:", e));
  }

  return NextResponse.json(order);
}
