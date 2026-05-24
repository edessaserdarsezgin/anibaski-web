const N8N_WEBHOOK_URL = process.env.N8N_WHATSAPP_WEBHOOK_URL;

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
  total: number;
  items: string;
}) {
  post({
    event: "order_created",
    phone: formatPhone(params.phone),
    orderNo: params.orderNo,
    total: params.total.toLocaleString("tr-TR"),
    items: params.items,
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
