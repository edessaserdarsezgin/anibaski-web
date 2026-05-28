import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type OrderItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  uploadedImages: string[];
};

type Params = {
  orderId: string;
  customerEmail: string;
  customerName: string | null;
  items: OrderItem[];
  total: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    district: string;
    city: string;
  };
  discountCode?: string | null;
  discountAmount?: number | null;
};

export async function sendOrderNotification(params: Params) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !process.env.RESEND_API_KEY) return;

  const { orderId, customerEmail, customerName, items, total, shippingAddress, discountCode, discountAmount } = params;
  const shortId = orderId.slice(0, 8).toUpperCase();

  const photoItems = items.filter(i => i.uploadedImages?.length > 0);
  const totalPhotos = photoItems.reduce((sum, i) => sum + i.uploadedImages.length, 0);

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #ece8e1">${item.productName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ece8e1;text-align:center">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ece8e1;text-align:right">${item.unitPrice.toLocaleString("tr-TR")} ₺</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ece8e1;text-align:right;font-weight:600">${(item.unitPrice * item.quantity).toLocaleString("tr-TR")} ₺</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ece8e1;text-align:center">
        ${item.uploadedImages?.length > 0 ? `<span style="color:#e07a5f;font-weight:600">${item.uploadedImages.length} fotoğraf</span>` : "—"}
      </td>
    </tr>
  `).join("");

  const photoLinks = photoItems.flatMap(item =>
    item.uploadedImages.map((url, i) =>
      `<a href="${url}" style="display:inline-block;margin:4px;padding:6px 12px;background:#fdfbf7;border:1px solid #ece8e1;border-radius:6px;font-size:12px;color:#3d405b;text-decoration:none">
        ${item.productName} – Fotoğraf ${i + 1}
      </a>`
    )
  ).join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fdfbf7;font-family:Arial,sans-serif;color:#3d405b">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;border:1px solid #ece8e1;overflow:hidden">

    <div style="background:#e07a5f;padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px">🖨 Yeni Sipariş — #${shortId}</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px">
        ${customerName ?? customerEmail} tarafından verildi
      </p>
    </div>

    <div style="padding:32px">

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead>
          <tr style="background:#fdfbf7">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#8187a2">ÜRÜN</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#8187a2">ADET</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#8187a2">BİRİM</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#8187a2">TUTAR</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#8187a2">FOTOĞRAF</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          ${discountCode && discountAmount ? `
          <tr>
            <td colspan="3" style="padding:8px 12px;text-align:right;color:#2d6a4f">Kupon (${discountCode})</td>
            <td style="padding:8px 12px;text-align:right;color:#2d6a4f;font-weight:600">−${discountAmount.toLocaleString("tr-TR")} ₺</td>
            <td></td>
          </tr>` : ""}
          <tr>
            <td colspan="3" style="padding:12px;text-align:right;font-weight:700">Toplam</td>
            <td style="padding:12px;text-align:right;font-weight:700;color:#e07a5f">${total.toLocaleString("tr-TR")} ₺</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <div style="background:#fdfbf7;border-radius:12px;padding:16px;margin-bottom:24px">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700">Teslimat Adresi</p>
        <p style="margin:0;font-size:13px;color:#8187a2;line-height:1.6">
          ${shippingAddress.fullName} · ${shippingAddress.phone}<br>
          ${shippingAddress.address}<br>
          ${shippingAddress.district}, ${shippingAddress.city}
        </p>
      </div>

      ${totalPhotos > 0 ? `
      <div style="background:#fff8f6;border:1px solid #fcd5c8;border-radius:12px;padding:16px;margin-bottom:24px">
        <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#e07a5f">
          📷 Müşteri Fotoğrafları (${totalPhotos} adet)
        </p>
        <p style="margin:0 0 12px;font-size:12px;color:#8187a2">
          Linkler 7 gün geçerlidir. Admin panelinden ZIP olarak indirebilirsiniz.
        </p>
        <div>${photoLinks}</div>
        <div style="margin-top:12px">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/siparisler/${orderId}"
            style="display:inline-block;padding:10px 20px;background:#e07a5f;color:#fff;border-radius:20px;font-size:13px;font-weight:700;text-decoration:none">
            Sipariş Detayına Git →
          </a>
        </div>
      </div>
      ` : ""}

    </div>
  </div>
</body>
</html>`;

  const fromAddress = process.env.EMAIL_FROM || "AnıBaskı <onboarding@resend.dev>";

  await resend.emails.send({
    from: fromAddress,
    to: adminEmail,
    subject: `Yeni Sipariş #${shortId}${totalPhotos > 0 ? ` — ${totalPhotos} fotoğraf` : ""}`,
    html,
  });
}
