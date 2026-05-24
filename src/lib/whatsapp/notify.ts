const N8N_WEBHOOK_URL = process.env.N8N_WHATSAPP_WEBHOOK_URL;

// Türk telefon numarasını WhatsApp formatına çevirir: 05XX → 905XX
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return "9" + digits;
  return "90" + digits;
}

export async function notifyOrderCreated(params: {
  phone: string;
  orderNo: string;
  total: number;
  items: string;
}) {
  if (!N8N_WEBHOOK_URL) return;
  fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "order_created",
      phone: formatPhone(params.phone),
      orderNo: params.orderNo,
      total: params.total.toLocaleString("tr-TR"),
      items: params.items,
    }),
  }).catch((err) => console.error("[WA notify order]", err));
}

export async function notifyShippingUpdate(params: {
  phone: string;
  orderNo: string;
  trackingCode: string;
}) {
  if (!N8N_WEBHOOK_URL) return;
  fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "shipping_update",
      phone: formatPhone(params.phone),
      orderNo: params.orderNo,
      trackingCode: params.trackingCode,
    }),
  }).catch((err) => console.error("[WA notify shipping]", err));
}
