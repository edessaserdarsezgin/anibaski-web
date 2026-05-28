import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

const PAYTR_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "orderId gerekli" }, { status: 400 });

  const adminClient = createAdminClient();

  const { data: order } = await adminClient
    .from("orders")
    .select("id, total, addressId")
    .eq("id", orderId)
    .eq("userId", user.id)
    .single();

  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });

  const { data: address } = await adminClient
    .from("addresses")
    .select("fullName, phone, address, city, district")
    .eq("id", order.addressId)
    .single();

  const { data: orderItems } = await adminClient
    .from("order_items")
    .select("quantity, unitPrice, product:products(name)")
    .eq("orderId", orderId);

  const merchantId   = process.env.PAYTR_MERCHANT_ID!.trim();
  const merchantKey  = process.env.PAYTR_MERCHANT_KEY!.trim();
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT!.trim();
  const testMode     = process.env.PAYTR_TEST_MODE ?? "1";
  // Redirect URL'i tarayıcıya gider — session cookie'nin geçerli olduğu adres olmalı
  // Canlıda PAYTR_REDIRECT_BASE_URL set edilmezse NEXT_PUBLIC_SITE_URL kullanılır
  const siteUrl      = process.env.PAYTR_REDIRECT_BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL!;

  const userIp        = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "1.2.3.4";
  const paymentAmount = Math.round(Number(order.total) * 100).toString();
  // PayTR merchant_oid sadece alfanümerik kabul eder — UUID tirelerini kaldır
  const merchantOid   = orderId.replace(/-/g, "");

  const userBasket = Buffer.from(
    JSON.stringify(
      (orderItems ?? []).map((item) => {
        const product = item.product as unknown as { name: string } | { name: string }[] | null;
        const productName = Array.isArray(product) ? product[0]?.name : product?.name;
        return [
          productName ?? "Ürün",
          (Number(item.unitPrice) * 100).toFixed(0),
          item.quantity.toString(),
        ];
      })
    )
  ).toString("base64");

  const noInstallment = "0";
  const maxInstallment = "0";
  const currency = "TL";

  const hashStr = merchantId + userIp + merchantOid + user.email! + paymentAmount + userBasket + noInstallment + maxInstallment + currency + testMode;
  const paytrToken = crypto.createHmac("sha256", merchantKey).update(hashStr + merchantSalt).digest("base64");

  const params = new URLSearchParams({
    merchant_id:      merchantId,
    user_ip:          userIp,
    merchant_oid:     merchantOid,
    email:            user.email!,
    payment_amount:   paymentAmount,
    currency,
    user_basket:      userBasket,
    no_installment:   noInstallment,
    max_installment:  maxInstallment,
    user_name:        address?.fullName ?? user.email!,
    user_address:     address ? `${address.address}, ${address.district}, ${address.city}` : "",
    user_phone:       address?.phone ?? "",
    merchant_ok_url:  `${siteUrl}/siparis-tamamlandi/${orderId}`,
    merchant_fail_url:`${siteUrl}/odeme?fail=1`,
    timeout_limit:    "30",
    debug_on:         testMode === "1" ? "1" : "0",
    test_mode:        testMode,
    lang:             "tr",
    paytr_token:      paytrToken,
  });

  const res = await fetch(PAYTR_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const result = await res.json();

  if (result.status === "success") {
    return NextResponse.json({ token: result.token });
  }

  console.error("[PayTR token error]", result);
  return NextResponse.json({ error: result.reason ?? "Token alınamadı" }, { status: 500 });
}
