import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyPaymentFailed } from "@/lib/whatsapp/notify";
import crypto from "crypto";

// PayTR callback URL'si — session/auth koruması olmadan erişilebilir olmalı
export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const merchantOid = formData.get("merchant_oid") as string;
  const status      = formData.get("status") as string;
  const totalAmount = formData.get("total_amount") as string;
  const hash        = formData.get("hash") as string;

  if (!merchantOid || !status || !totalAmount || !hash) {
    return new Response("MISSING_PARAMS", { status: 400 });
  }

  const merchantKey  = process.env.PAYTR_MERCHANT_KEY!;
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT!;

  // Hash doğrulama — sahte callback'lere karşı
  const expectedHash = crypto
    .createHmac("sha256", merchantKey)
    .update(merchantOid + merchantSalt + status + totalAmount)
    .digest("base64");

  if (hash !== expectedHash) {
    console.error("[PayTR callback] Hash uyuşmazlığı", { merchantOid });
    return new Response("HASH_MISMATCH", { status: 400 });
  }

  // merchant_oid tireli UUID'e dönüştür (token'da tireler kaldırılmıştı)
  const hex = merchantOid.replace(/-/g, "");
  const orderId = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;

  const adminClient = createAdminClient();

  if (status === "success") {
    await adminClient
      .from("orders")
      .update({ paymentStatus: "paid", paymentRef: merchantOid, status: "PROCESSING" })
      .eq("id", orderId);
  } else {
    await adminClient
      .from("orders")
      .update({ paymentStatus: "failed" })
      .eq("id", orderId);

    // Ödeme başarısız → müşteriye WhatsApp bildirimi
    const { data: order } = await adminClient
      .from("orders")
      .select("addressId")
      .eq("id", orderId)
      .single();

    if (order) {
      const { data: address } = await adminClient
        .from("addresses").select("phone").eq("id", order.addressId).single();

      if (address?.phone) {
        notifyPaymentFailed({
          phone: address.phone,
          orderNo: orderId.slice(0, 8).toUpperCase(),
        });
      }
    }
  }

  // PayTR "OK" yanıtı bekler — farklı bir şey dönerse 1 dk sonra tekrar dener
  return new Response("OK", { status: 200 });
}
