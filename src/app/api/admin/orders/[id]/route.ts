import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notifyStatusUpdate, notifyShippingUpdate } from "@/lib/whatsapp/notify";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "ADMIN") return null;
  return { user, supabase: createAdminClient() };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json();

  const validStatuses = ["PENDING", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: order, error } = await admin.supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select('"userId", "addressId", "trackingCode"')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // WhatsApp bildirimi — fire-and-forget
  if (order?.userId && ["PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status)) {
    const [{ data: profile }, { data: address }] = await Promise.all([
      admin.supabase.from("profiles").select("phone").eq("id", order.userId).single(),
      admin.supabase.from("addresses").select("phone").eq("id", order.addressId).single(),
    ]);

    const phone = profile?.phone || address?.phone;
    if (phone) {
      const orderNo = id.slice(0, 8).toUpperCase();
      if (status === "SHIPPED") {
        notifyShippingUpdate({ phone, orderNo, trackingCode: order.trackingCode ?? "" });
      } else {
        notifyStatusUpdate({ phone, orderNo, status: status as "PREPARING" | "DELIVERED" | "CANCELLED" });
      }
    }
  }

  return NextResponse.json(order);
}
