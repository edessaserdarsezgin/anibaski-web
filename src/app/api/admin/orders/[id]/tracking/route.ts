import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendShippingNotification } from "@/lib/email/shippingNotification";
import { notifyShippingUpdate } from "@/lib/whatsapp/notify";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "ADMIN") return null;
  return { user, supabase: createAdminClient() };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { trackingCode } = await req.json();

  if (!trackingCode?.trim()) {
    return NextResponse.json({ error: "Kargo kodu gerekli" }, { status: 400 });
  }

  const { error } = await admin.supabase
    .from("orders")
    .update({ "trackingCode": trackingCode.trim(), status: "SHIPPED" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: order } = await admin.supabase
    .from("orders")
    .select('"userId", "addressId"')
    .eq("id", id)
    .single();

  if (order?.userId) {
    const [{ data: profile }, { data: address }] = await Promise.all([
      admin.supabase.from("profiles").select('email, "fullName", phone').eq("id", order.userId).single(),
      admin.supabase.from("addresses").select("phone").eq("id", order.addressId).single(),
    ]);

    const phone = profile?.phone || address?.phone;
    if (phone) {
      notifyShippingUpdate({
        phone,
        orderNo: id.slice(0, 8).toUpperCase(),
        trackingCode: trackingCode.trim(),
      });
    }

    if (profile) {
      try {
        await sendShippingNotification({
          orderId: id,
          customerEmail: profile.email,
          customerName: profile.fullName ?? null,
          trackingCode: trackingCode.trim(),
        });
      } catch (emailErr) {
        console.error("[tracking] e-posta gönderilemedi:", emailErr);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
