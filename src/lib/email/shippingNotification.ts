import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type Params = {
  orderId: string;
  customerEmail: string;
  customerName: string | null;
  trackingCode: string;
};

export async function sendShippingNotification(params: Params) {
  if (!process.env.RESEND_API_KEY) return;

  const { orderId, customerEmail, customerName, trackingCode } = params;
  const shortId = orderId.slice(0, 8).toUpperCase();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const fromAddress = process.env.EMAIL_FROM || "AnıBaskı <onboarding@resend.dev>";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fdfbf7;font-family:Arial,sans-serif;color:#3d405b">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;border:1px solid #ece8e1;overflow:hidden">

    <div style="background:#e07a5f;padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px">📦 Siparişiniz Kargoya Verildi!</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px">
        Sipariş #${shortId}
      </p>
    </div>

    <div style="padding:32px">
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6">
        Merhaba ${customerName ?? "Değerli Müşterimiz"},<br><br>
        Siparişiniz hazırlandı ve kargoya teslim edildi. Aşağıdaki takip koduyla siparişinizi takip edebilirsiniz.
      </p>

      <div style="background:#fdfbf7;border:2px solid #e07a5f;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:13px;color:#8187a2;font-weight:600;letter-spacing:0.05em">KARGO TAKİP KODU</p>
        <p style="margin:0;font-size:24px;font-weight:700;color:#e07a5f;letter-spacing:0.1em">${trackingCode}</p>
      </div>

      <p style="margin:0 0 24px;font-size:13px;color:#8187a2;line-height:1.6">
        Kargo takibini PTT Kargo, Yurtiçi Kargo veya Aras Kargo web sitelerinden yapabilirsiniz.
      </p>

      <div style="text-align:center">
        <a href="${siteUrl}/siparisler/${orderId}"
          style="display:inline-block;padding:12px 28px;background:#e07a5f;color:#fff;border-radius:24px;font-size:14px;font-weight:700;text-decoration:none">
          Sipariş Detayını Gör →
        </a>
      </div>
    </div>

    <div style="background:#fdfbf7;padding:16px 32px;border-top:1px solid #ece8e1;text-align:center">
      <p style="margin:0;font-size:12px;color:#8187a2">
        AnıBaskı · Sorularınız için <a href="mailto:destek@anibaskı.com" style="color:#e07a5f">destek@anibaskı.com</a>
      </p>
    </div>

  </div>
</body>
</html>`;

  await resend.emails.send({
    from: fromAddress,
    to: customerEmail,
    subject: `Siparişiniz Kargoya Verildi — #${shortId} | AnıBaskı`,
    html,
  });
}
