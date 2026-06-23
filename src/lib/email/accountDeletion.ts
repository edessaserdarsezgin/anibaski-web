import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendAccountDeletionRequest(params: {
  userId: string;
  userEmail: string;
  userName: string | null;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !process.env.RESEND_API_KEY) return;

  const { userId, userEmail, userName } = params;
  const resend = getResend();

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "AnıBaskı <noreply@anibaski.com>",
    to: adminEmail,
    subject: "⚠️ Hesap Silme Talebi",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#3d405b">Hesap Silme Talebi</h2>
        <p>Bir kullanıcı KVKK kapsamında hesap silme talebinde bulundu.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr>
            <td style="padding:8px 12px;background:#f9f5f0;font-weight:600;color:#3d405b;border-radius:4px 0 0 4px">Ad</td>
            <td style="padding:8px 12px;background:#f9f5f0;color:#3d405b">${userName ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-weight:600;color:#3d405b">E-posta</td>
            <td style="padding:8px 12px;color:#3d405b">${userEmail}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#f9f5f0;font-weight:600;color:#3d405b;border-radius:0 0 0 4px">Kullanıcı ID</td>
            <td style="padding:8px 12px;background:#f9f5f0;color:#3d405b;font-family:monospace">${userId}</td>
          </tr>
        </table>
        <p style="color:#8187a2;font-size:13px">
          Talebi işlemek için Supabase Dashboard → Authentication → Users bölümünden kullanıcıyı silebilirsiniz.
          Sipariş geçmişi ve yasal belgeler için ilgili kayıtları saklayın.
        </p>
      </div>
    `,
  });
}
