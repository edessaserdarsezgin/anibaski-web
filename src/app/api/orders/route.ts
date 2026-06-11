import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendOrderNotification } from "@/lib/email/orderNotification";
import { notifyOrderCreated } from "@/lib/whatsapp/notify";
import { activeDiscountPercent, applyDiscount } from "@/lib/pricing";
import { getShippingSettings } from "@/lib/shipping";
import { hasPriorOrder } from "@/lib/coupons";

type IncomingItem = {
  productId: string;
  productName?: string;
  variantSelections?: Record<string, { id?: string; label?: string } | unknown>;
  quantity: number;
  uploadedImages?: string[];
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  // DİKKAT: istemciden gelen subtotal/shippingFee/total/unitPrice GÜVENİLMEZ — sunucuda yeniden hesaplanır.
  const { shippingAddressId, billingAddressId, paymentMethod, items, discountCode, source } = body as {
    shippingAddressId?: string; billingAddressId?: string; paymentMethod?: string;
    items?: IncomingItem[]; discountCode?: string | null; source?: string;
  };

  if (!shippingAddressId) return NextResponse.json({ error: "Teslimat adresi gerekli" }, { status: 400 });
  if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "Sepet boş" }, { status: 400 });

  await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email!,
    fullName: user.user_metadata?.full_name ?? null,
  });

  // ── Sunucu-taraflı fiyat yeniden hesaplama (fiyat manipülasyonuna karşı) ──
  const adminDb = createAdminClient();
  const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))];
  const variantIds = [...new Set(
    items.flatMap((i) => Object.values(i.variantSelections ?? {}).map((v) => (v as { id?: string })?.id).filter(Boolean) as string[])
  )];

  const [{ data: products }, { data: variants }] = await Promise.all([
    adminDb.from("products").select("id, basePrice, discount_percent, discount_starts_at, discount_ends_at, isActive").in("id", productIds),
    variantIds.length
      ? adminDb.from("product_variants").select("id, productId, priceAddon").in("id", variantIds)
      : Promise.resolve({ data: [] as { id: string; productId: string; priceAddon: number }[] }),
  ]);

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));

  const computedItems: { productId: string; productName?: string; variantSelections: Record<string, unknown>; quantity: number; unitPrice: number; uploadedImages: string[] }[] = [];
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product || product.isActive === false) {
      return NextResponse.json({ error: "Sepette geçersiz veya pasif ürün var." }, { status: 400 });
    }
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));

    let addons = 0;
    for (const sel of Object.values(item.variantSelections ?? {})) {
      const vid = (sel as { id?: string })?.id;
      if (!vid) continue;
      const v = variantMap.get(vid);
      if (v && v.productId === item.productId) addons += Number(v.priceAddon) || 0;
    }

    const fullUnit = Number(product.basePrice) + addons;
    const unitPrice = applyDiscount(fullUnit, activeDiscountPercent(product));

    computedItems.push({
      productId: item.productId,
      productName: item.productName,
      variantSelections: (item.variantSelections as Record<string, unknown>) ?? {},
      quantity,
      unitPrice,
      uploadedImages: item.uploadedImages ?? [],
    });
  }

  const subtotal = Math.round(computedItems.reduce((s, it) => s + it.unitPrice * it.quantity, 0) * 100) / 100;

  // Kargo + kapıda ödeme bedeli — ayarlardan
  const ship = await getShippingSettings();
  const baseShipping = subtotal >= ship.freeShippingThreshold ? 0 : ship.shippingFee;
  const codFee = paymentMethod === "cod" ? ship.codFee : 0;
  const shippingFee = baseShipping + codFee;

  // Kupon — server-side doğrulama (sunucu subtotal'ı ile)
  let discountAmount = 0;
  let validatedCouponCode: string | null = null;
  if (discountCode) {
    const { data: coupon } = await adminDb
      .from("coupons").select("*").eq("code", discountCode).eq("is_active", true).single();

    const expired = coupon && coupon.expires_at && new Date(coupon.expires_at) < new Date();
    if (expired) {
      createAdminClient().from("coupons").update({ is_active: false }).eq("id", coupon.id);
    }

    // İlk-sipariş kuponu: üyenin önceki tamamlanmış siparişi varsa geçersiz
    const firstOrderViolation = !!(coupon && coupon.first_order_only) && await hasPriorOrder(user.id);

    if (coupon && !expired && !firstOrderViolation &&
      !(coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) &&
      !(coupon.min_order_amount && subtotal < Number(coupon.min_order_amount))
    ) {
      discountAmount = coupon.discount_type === "percentage"
        ? Math.round(subtotal * (Number(coupon.discount_value) / 100) * 100) / 100
        : Math.min(Number(coupon.discount_value), subtotal);
      validatedCouponCode = coupon.code;

      if (paymentMethod === "cod") {
        const newCount = coupon.used_count + 1;
        const limitReached = coupon.max_uses !== null && newCount >= coupon.max_uses;
        await createAdminClient().from("coupons").update({
          used_count: newCount,
          ...(limitReached && { is_active: false }),
        }).eq("id", coupon.id);
      }
    }
  }

  const total = Math.round((subtotal + shippingFee - discountAmount) * 100) / 100;

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
      source: source === "guided" ? "guided" : "direct",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order save failed" }, { status: 500 });
  }

  await supabase.from("order_items").insert(
    computedItems.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      variantSelections: item.variantSelections,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      uploadedImages: item.uploadedImages,
    }))
  );

  // Kapıda ödemede bildirim hemen gönderilir (ödeme zaten kapıda)
  // Kredi kartında bildirimler PayTR callback'te gönderilir (ödeme onayı sonrası)
  if (paymentMethod === "cod") {
    const [{ data: address }, { data: profile }] = await Promise.all([
      supabase.from("addresses").select("fullName, phone, address, district, city").eq("id", shippingAddressId).single(),
      supabase.from("profiles").select("phone, notify_delivery_contact").eq("id", user.id).single(),
    ]);

    const itemsText = computedItems.map((item) => {
      const name = item.productName ?? item.productId;
      const vs = item.variantSelections as Record<string, { label?: string }> | null;
      const variants = vs && Object.keys(vs).length > 0
        ? " (" + Object.values(vs).map((v) => v?.label).filter(Boolean).join(", ") + ")"
        : "";
      const unitPrice = item.unitPrice.toLocaleString("tr-TR");
      const lineTotal = (item.unitPrice * item.quantity).toLocaleString("tr-TR");
      const priceStr = item.quantity > 1 ? `${unitPrice} ₺ × ${item.quantity} = ${lineTotal} ₺` : `${lineTotal} ₺`;
      return `• ${name}${variants}: ${priceStr}`;
    }).join("\n");

    const notifyPayload = {
      orderNo: order.id.slice(0, 8).toUpperCase(),
      subtotal,
      shippingFee,
      total,
      items: itemsText,
      discountCode: validatedCouponCode,
      discountAmount: discountAmount > 0 ? discountAmount : null,
    };

    const recipients = new Set<string>();
    if (profile?.phone) recipients.add(profile.phone);
    if (profile?.notify_delivery_contact && address?.phone) recipients.add(address.phone);

    recipients.forEach((phone) => notifyOrderCreated({ phone, ...notifyPayload }));

    sendOrderNotification({
      orderId: order.id,
      customerEmail: user.email!,
      customerName: user.user_metadata?.full_name ?? null,
      items: computedItems.map((item) => ({
        productName: item.productName ?? item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        uploadedImages: item.uploadedImages,
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
