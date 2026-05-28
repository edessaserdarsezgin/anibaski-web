/**
 * Netgsm IYS SMS API entegrasyonu.
 * Gereken env değişkenleri:
 *   NETGSM_USERCODE   — Netgsm panel kullanıcı kodu
 *   NETGSM_PASSWORD   — Netgsm panel şifresi
 *   NETGSM_HEADER     — Onaylı gönderici başlığı (ör: ANIBASKI)
 *
 * Dokümantasyon: https://www.netgsm.com.tr/dokuman/
 */

const NETGSM_URL = "https://api.netgsm.com.tr/sms/rest/v2/send";

export async function sendNetgsm({ phone, message }: { phone: string; message: string }) {
  const usercode = process.env.NETGSM_USERCODE;
  const password = process.env.NETGSM_PASSWORD;
  const msgheader = process.env.NETGSM_HEADER;

  if (!usercode || !password || !msgheader) {
    return { ok: false, provider: "netgsm", error: "Netgsm env değişkenleri eksik" };
  }

  // Netgsm "90" ön ekli 12 haneli numara bekler
  const number = phone.replace(/\D/g, "").replace(/^90/, "");

  try {
    const res = await fetch(NETGSM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${usercode}:${password}`).toString("base64"),
      },
      body: JSON.stringify({
        msgheader,
        messages: [{ msg: message, no: number }],
        encoding: "TR",
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || data?.code !== "00") {
      console.error("[Netgsm] gönderim hatası:", data);
      return { ok: false, provider: "netgsm", error: data?.description ?? "Netgsm hata" };
    }
    return { ok: true, provider: "netgsm" };
  } catch (err) {
    console.error("[Netgsm] istek hatası:", err);
    return { ok: false, provider: "netgsm", error: err instanceof Error ? err.message : "Bilinmeyen hata" };
  }
}
