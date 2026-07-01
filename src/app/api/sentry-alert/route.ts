import { NextRequest, NextResponse } from "next/server";

// Sentry Alert (Internal Integration webhook) → Telegram köprüsü.
// Sentry panelinde: Settings → Custom Integrations → webhook URL olarak
//   https://anibaski.com/api/sentry-alert?s=<SENTRY_WEBHOOK_SECRET>
// verilir; Alert rule action olarak bu integration seçilir.
//
// Gerekli env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SENTRY_WEBHOOK_SECRET
// (Uptime Kuma ile aynı bot kullanılabilir.)

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(req: NextRequest) {
  // Basit paylaşılan-anahtar koruması (URL ?s=...)
  const secret = process.env.SENTRY_WEBHOOK_SECRET;
  if (secret && req.nextUrl.searchParams.get("s") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  // Env eksikse Sentry'nin retry fırtınası yapmaması için 200 dön.
  if (!botToken || !chatId) {
    console.error("[sentry-alert] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID eksik");
    return NextResponse.json({ ok: false, reason: "telegram env missing" });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  // Sentry payload'ı sürüme göre değişir; savunmacı çıkarım:
  const data = (body as { data?: Record<string, unknown> }).data ?? {};
  const event = (data.event ?? (body as { event?: Record<string, unknown> }).event ?? body) as Record<string, unknown>;

  const title = event.title ?? event.message ?? data.triggered_rule ?? "Sentry uyarısı";
  const level = event.level ?? "error";
  const culprit = event.culprit ?? event.transaction ?? "";
  const environment = event.environment ?? "";
  const url = event.web_url ?? event.issue_url ?? event.url ?? "https://sentry.io";

  const lines = [
    `🚨 <b>AnıBaskı — Sentry</b>`,
    `<b>${esc(title)}</b>`,
    culprit ? `📍 ${esc(culprit)}` : "",
    `⚠️ ${esc(level)}${environment ? ` · ${esc(environment)}` : ""}`,
    `🔗 <a href="${esc(url)}">Sentry'de aç</a>`,
  ].filter(Boolean);

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error("[sentry-alert] Telegram gönderim hatası:", await res.text().catch(() => res.status));
    }
  } catch (e) {
    console.error("[sentry-alert] Telegram fetch hatası:", e);
  }

  // Sentry'ye her zaman 200 (webhook başarılı sayılsın, retry olmasın)
  return NextResponse.json({ ok: true });
}
