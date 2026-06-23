import { createAdminClient } from "@/lib/supabase/server";

const N8N_WEBHOOK_URL = process.env.N8N_WHATSAPP_WEBHOOK_URL;

export async function getAdminPhone(): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("phone")
    .eq("role", "ADMIN")
    .not("phone", "is", null)
    .limit(1)
    .single();
  return data?.phone ?? null;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return "9" + digits;
  return "90" + digits;
}

function post(body: Record<string, unknown>) {
  if (!N8N_WEBHOOK_URL) return;
  fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => console.error("[WA notify]", err));
}

export function notifyOrderCreated(params: {
  phone: string;
  orderNo: string;
  subtotal: number;
  shippingFee: number;
  codFee?: number;
  total: number;
  items: string;
  discountCode?: string | null;
  discountAmount?: number | null;
}) {
  post({
    event: "order_created",
    phone: formatPhone(params.phone),
    orderNo: params.orderNo,
    subtotal: params.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    shippingFee: params.shippingFee === 0 ? "Ücretsiz" : params.shippingFee.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺",
    ...(params.codFee && params.codFee > 0
      ? { codFee: params.codFee.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺" }
      : {}),
    total: params.total.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    items: params.items,
    ...(params.discountCode && params.discountAmount
      ? { discountCode: params.discountCode, discountAmount: params.discountAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
      : {}),
  });
}

export function notifyPaymentFailed(params: {
  phone: string;
  orderNo: string;
}) {
  post({
    event: "payment_failed",
    phone: formatPhone(params.phone),
    orderNo: params.orderNo,
  });
}

export function notifyShippingUpdate(params: {
  phone: string;
  orderNo: string;
  trackingCode: string;
}) {
  post({
    event: "shipping_update",
    phone: formatPhone(params.phone),
    orderNo: params.orderNo,
    trackingCode: params.trackingCode,
  });
}

export function notifyStatusUpdate(params: {
  phone: string;
  orderNo: string;
  status: "PREPARING" | "DELIVERED" | "CANCELLED";
}) {
  post({
    event: "status_update",
    phone: formatPhone(params.phone),
    orderNo: params.orderNo,
    status: params.status,
  });
}

export function notifyCancelRequested(params: { phone: string; orderNo: string }) {
  post({ event: "cancel_requested", phone: formatPhone(params.phone), orderNo: params.orderNo });
}

export function notifyCancelApproved(params: { phone: string; orderNo: string }) {
  post({ event: "cancel_approved", phone: formatPhone(params.phone), orderNo: params.orderNo });
}

export function notifyCancelRejected(params: { phone: string; orderNo: string }) {
  post({ event: "cancel_rejected", phone: formatPhone(params.phone), orderNo: params.orderNo });
}

export function notifyAbandonedCart(params: {
  phone: string;
  itemCount: number;
  subtotal: number;
  cartUrl: string;
  couponCode: string;
  stage: "first" | "second";
}) {
  post({
    event: "abandoned_cart",
    phone: formatPhone(params.phone),
    stage: params.stage,
    itemCount: params.itemCount,
    subtotal: params.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    cartUrl: params.cartUrl,
    couponCode: params.couponCode,
  });
}

export async function notifyAdminCancelRequest(params: { orderNo: string; customerName: string }) {
  const adminPhone = await getAdminPhone();
  if (!adminPhone) return;
  post({ event: "admin_cancel_request", phone: formatPhone(adminPhone), orderNo: params.orderNo, customerName: params.customerName });
}

export function notifyAdminNewReview(adminPhone: string, params: {
  productName: string;
  productSlug: string;
  customerName: string | null;
  rating: number;
  title?: string | null;
  body?: string | null;
}) {
  const stars = "⭐".repeat(params.rating);
  post({
    event: "admin_new_review",
    phone: formatPhone(adminPhone),
    productName: params.productName,
    productSlug: params.productSlug,
    customerName: params.customerName ?? "Anonim",
    rating: params.rating,
    stars,
    ...(params.title ? { title: params.title } : {}),
    ...(params.body ? { body: params.body } : {}),
  });
}

export function notifyAdminNewQuestion(adminPhone: string, params: {
  productName: string;
  productSlug: string;
  customerName: string | null;
  question: string;
}) {
  post({
    event: "admin_new_question",
    phone: formatPhone(adminPhone),
    productName: params.productName,
    productSlug: params.productSlug,
    customerName: params.customerName ?? "Anonim",
    question: params.question,
  });
}
