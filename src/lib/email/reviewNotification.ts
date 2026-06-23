import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

type Params = {
  productName: string;
  productSlug: string;
  customerName: string | null;
  rating: number;
  title?: string | null;
  body?: string | null;
};

export async function sendReviewNotification(params: Params) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !process.env.RESEND_API_KEY) return;

  const { productName, productSlug, customerName, rating, title, body } = params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fdfbf7;font-family:Arial,sans-serif;color:#3d405b">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;border:1px solid #ece8e1;overflow:hidden">
    <div style="background:#e07a5f;padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:20px">⭐ Yeni Ürün Yorumu</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px">${productName}</p>
    </div>
    <div style="padding:28px 32px">
      <p style="margin:0 0 4px;font-size:22px;letter-spacing:2px;color:#f2cc8f">${stars}</p>
      <p style="margin:0 0 16px;font-size:13px;color:#8187a2">${customerName ?? "Anonim"} tarafından — onay bekliyor</p>
      ${title ? `<p style="margin:0 0 8px;font-weight:700;font-size:15px">${title}</p>` : ""}
      ${body ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#3d405b">${body}</p>` : ""}
      <a href="${siteUrl}/admin/yorumlar"
        style="display:inline-block;padding:10px 22px;background:#e07a5f;color:#fff;border-radius:20px;font-size:13px;font-weight:700;text-decoration:none">
        Yorumu İncele →
      </a>
      <p style="margin:16px 0 0;font-size:12px;color:#8187a2">
        Ürün: <a href="${siteUrl}/urun/${productSlug}" style="color:#e07a5f">${productName}</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const fromAddress = process.env.EMAIL_FROM || "AnıBaskı <onboarding@resend.dev>";

  await getResend().emails.send({
    from: fromAddress,
    to: adminEmail,
    subject: `Yeni Yorum: ${productName} — ${stars}`,
    html,
  });
}
