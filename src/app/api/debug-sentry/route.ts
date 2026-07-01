import { NextRequest } from "next/server";
import { notFound } from "next/navigation";

// GEÇİCİ — Sentry doğrulama endpoint'i. Test bitince SİLİNECEK.
// Kullanım: /api/debug-sentry?s=<SENTRY_WEBHOOK_SECRET>
// Kasıtlı hata fırlatır → Sentry (onRequestError) yakalar → Alert rule → Telegram.
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("s") !== process.env.SENTRY_WEBHOOK_SECRET) {
    notFound();
  }
  throw new Error(`AnıBaskı Sentry doğrulama testi — ${new Date().toISOString()}`);
}
