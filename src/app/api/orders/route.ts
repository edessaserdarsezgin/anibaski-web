import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendOrderNotification } from "@/lib/email/orderNotification";
import { notifyOrderCreated } from "@/lib/whatsapp/notify";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { shippingAddressId, billingAddressId, paymentMethod, items, subtotal, shippingFee, total, discountCode, source } = body;

  if (!shippingAddressId) return NextResponse.json({ error: "Teslimat adresi gerekli" }, { status: 400 });

  await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email!,
    fullName: user.user_metadata?.full_name ?? null,
  });

  // Kupon server-side doğrulama
  let discountAmount = 0;
  let validatedCouponCode: string | null = null;
  if (discountCode) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", discountCode)
      .eq("is_active", true)
      .single();

    if (coupon &&
      !(coupon.expires_at && new Date(coupon.expires_at) < new Date()) &&
      !(coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) &&
      !(coupon.min_order_amount && subtotal < Number(coupon.min_order_amount))
    ) {
      discountAmount = coupon.discount_type === "percentage"
        ? Math.round(subtotal * (Number(coupon.discount_value) / 100) * 100) / 100
        : Math.min(Number(coupon.discount_value), subtotal);
      validatedCouponCode = coupon.code;

      // Kupon used_count yalnızca kapıda ödemede burada artar
      // Kredi kartında PayTR callback başarı durumunda artırılır
      if (paymentMethod === "cod") {
        await createAdminClient().from("coupons").update({ used_count: coupon.used_count + 1 }).eq("id", coupon.id);
      }
    }
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      userId: user.id,
      addressId: shippingAddressId,
      billingAddressId: billingAddressId ?? shippingAddressId,
      paymentMethod,
      subtotal,
      shippingFee,
      discount_code: validatedCouponCode,
      discount_amount: discountAmount > 0 ? discountAmount : null,
      total,
      status: "PENDING",
      source: source === "ai_guided" ? "ai_guided" : "direct",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order save failed" }, { status: 500 });
  }

  const orderItems = items.map((item: {
    productId: string;
    variantSelections: Record<string, unknown>;
    quantity: number;
    unitPrice: number;
    uploadedImages?: string[];
  }) => ({
    orderId: order.id,
    productId: item.productId,
    variantSelections: item.variantSelections ?? {},
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    uploadedImages: item.uploadedImages ?? [],
  }));

  await supabase.from("order_items").insert(orderItems);

  // Kapıda ödemede bildirim hemen gönderilir (ödeme zaten kapıda)
  // Kredi kartında bildirimler PayTR callback'te gönderilir (ödeme onayı sonrası)
  if (paymentMethod === "cod") {
    const { data: address } = await supabase
      .from("addresses").select("fullName, phone, address, district, city").eq("id", shippingAddressId).single();

    if (address?.phone) {
      notifyOrderCreated({
        phone: address.phone,
        orderNo: order.id.slice(0, 8).toUpperCase(),
        subtotal,
        shippingFee,
        total,
        items: items.map((item: { productName?: string; productId: string; quantity: number; unitPrice: number; variantSelections?: Record<string, string> }) => {
          const name = item.productName ?? item.productId;
          const variants = item.variantSelections && Object.keys(item.variantSelections).length > 0
            ? " (" + Object.entries(item.variantSelections).map(([k, v]) => `${k}: ${v}`).join(", ") + ")"
            : "";
          const unitPrice = item.unitPrice.toLocaleString("tr-TR");
          const lineTotal = (item.unitPrice * item.quantity).toLocaleString("tr-TR");
          const priceStr = item.quantity > 1 ? `${unitPrice} ₺ × ${item.quantity} = ${lineTotal} ₺` : `${lineTotal} ₺`;
          return `• ${name}${variants}: ${priceStr}`;
        }).join("\n"),
        discountCode: validatedCouponCode,
        discountAmount: discountAmount > 0 ? discountAmount : null,
      });
    }

    sendOrderNotification({
      orderId: order.id,
      customerEmail: user.email!,
      customerName: user.user_metadata?.full_name ?? null,
      items: items.map((item: { productId: string; variantSelections: Record<string, unknown>; quantity: number; unitPrice: number; uploadedImages?: string[]; productName?: string }) => ({
        productName: item.productName ?? item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        uploadedImages: item.uploadedImages ?? [],
      })),
      subtotal,
      shippingFee,
      total,
      shippingAddress: address ?? { fullName: "", phone: "", address: "", district: "", city: "" },
      discountCode: validatedCouponCode,
      discountAmount: discountAmount > 0 ? discountAmount : null,
    }).catch((err) => console.error("[orderNotification]", err));
  }

  return NextResponse.json({ orderId: order.id });
}
