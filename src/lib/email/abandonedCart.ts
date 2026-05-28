import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type Item = {
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
};

type Params = {
  to: string;
  customerName: string | null;
  items: Item[];
  subtotal: number;
  cartUrl: string;
  couponCode: string;
  stage: "first" | "second";
};

export async function sendAbandonedCartEmail(params: Params) {
  if (!process.env.RESEND_API_KEY) return;

  const from = process.env.EMAIL_FROM || "AnıBaskı <onboarding@resend.dev>";
  const { to, customerName, items, subtotal, cartUrl, couponCode, stage } = params;

  const greeting = customerName ? `${customerName},` : "Merhaba,";
  const subject = stage === "first"
    ? "🛒 Sepetinizdeki ürünler sizi bekliyor"
    : "📸 Son şans — sepetinizdeki ürünler hâlâ rezerve!";

  const headerMsg = stage === "first"
    ? "Sepetinize eklediğiniz ürünleri tamamlamayı unutmadınız mı?"
    : "Sepetinize göz atmaya az kalmıştı — hatırlattırmak istedik.";

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #ece8e1;width:60px">
        ${item.productImage
          ? `<img src="${item.productImage}" width="56" height="56" style="border-radius:8px;display:block" />`
          : `<div style="width:56px;height:56px;background:#fdfbf7;border-radius:8px"></div>`}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #ece8e1">
        <p style="margin:0;font-size:14px;color:#3d405b;font-weight:600">${item.productName}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#8187a2">Adet: ${item.quantity}</p>
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #ece8e1;text-align:right;font-weight:600;color:#e07a5f">
        ${(item.unitPrice * item.quantity).toLocaleString("tr-TR")} ₺
      </td>
    </tr>
  `).join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fdfbf7;font-family:Arial,sans-serif;color:#3d405b">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;border:1px solid #ece8e1;overflow:hidden">

    <div style="background:#e07a5f;padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px">🛒 Sepetiniz Sizi Bekliyor</h1>
    </div>

    <div style="padding:32px">
      <p style="margin:0 0 12px;font-size:15px">${greeting}</p>
      <p style="margin:0 0 20px;font-size:14px;color:#8187a2;line-height:1.6">${headerMsg}</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px 8px;text-align:right;font-weight:700;font-size:15px">Toplam</td>
            <td style="padding:12px 8px;text-align:right;font-weight:700;color:#e07a5f;font-size:15px">
              ${subtotal.toLocaleString("tr-TR")} ₺
            </td>
          </tr>
        </tfoot>
      </table>

      <div style="background:#fdfbf7;border:2px dashed #e07a5f;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px">
        <p style="margin:0;font-size:12px;color:#8187a2;text-transform:uppercase;letter-spacing:1px">Size özel kupon</p>
        <p style="margin:6px 0 4px;font-size:24px;font-weight:700;color:#e07a5f;font-family:'Courier New',monospace">${couponCode}</p>
        <p style="margin:0;font-size:12px;color:#8187a2">Sepetinizde %10 indirim</p>
      </div>

      <div style="text-align:center;margin-bottom:8px">
        <a href="${cartUrl}" style="display:inline-block;padding:14px 36px;background:#e07a5f;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;font-size:15px">
          Sepete Geri Dön
        </a>
      </div>

      <p style="margin:24px 0 0;font-size:11px;color:#8187a2;line-height:1.6;text-align:center">
        Bu e-postayı kampanya ve fırsat bildirimleri tercihiniz açık olduğu için aldınız.<br>
        İptal etmek için profilinizden ayarlarınızı değiştirebilirsiniz.
      </p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({ from, to, subject, html });
}
