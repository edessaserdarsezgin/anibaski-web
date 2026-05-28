/**
 * SMS gönderim soyutlama katmanı.
 * Sağlayıcı SMS_PROVIDER env değişkeniyle seçilir:
 *   - "mock" (varsayılan): konsola yazar, gerçek SMS göndermez
 *   - "netgsm": Netgsm HTTP API'sini kullanır
 *
 * Tüm sağlayıcılar aynı sözleşmeyi uygular:
 *   sendSms({ phone, message }) => Promise<{ ok: boolean; provider: string; error?: string }>
 */

import { sendNetgsm } from "./netgsm";

type SmsParams = { phone: string; message: string };
type SmsResult = { ok: boolean; provider: string; error?: string };

export async function sendSms(params: SmsParams): Promise<SmsResult> {
  const provider = (process.env.SMS_PROVIDER ?? "mock").toLowerCase();

  if (provider === "netgsm") {
    return sendNetgsm(params);
  }

  // Varsayılan: mock — geliştirme ortamı için
  console.log("\n📱 [MOCK SMS]");
  console.log(`  Telefon: ${params.phone}`);
  console.log(`  Mesaj  : ${params.message}\n`);
  return { ok: true, provider: "mock" };
}

/**
 * Telefon numarasını E.164 benzeri formata getirir.
 * "0530…" → "905305xxxxxx"
 * "+90530…" → "905305xxxxxx"
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return "9" + digits;
  return "90" + digits;
}
