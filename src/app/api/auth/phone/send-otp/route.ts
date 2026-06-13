import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendSms, formatPhone } from "@/lib/sms";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 dakika
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 saat
const MAX_PER_HOUR = 3;

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone, phone_verified")
    .eq("id", user.id)
    .single();

  if (!profile?.phone) {
    return NextResponse.json({ error: "Önce profilinize telefon numarası ekleyin." }, { status: 400 });
  }
  if (profile.phone_verified) {
    return NextResponse.json({ error: "Telefon numaranız zaten doğrulanmış." }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Rate limit: son 1 saatte 3'ten fazla kod istenmesin
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count } = await adminClient
    .from("phone_verifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);

  if ((count ?? 0) >= MAX_PER_HOUR) {
    return NextResponse.json(
      { error: "Çok fazla doğrulama kodu istediniz. Lütfen 1 saat sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  // 6 haneli kod üret
  const code = crypto.randomInt(100000, 999999).toString();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  const formattedPhone = formatPhone(profile.phone);

  await adminClient.from("phone_verifications").insert({
    user_id: user.id,
    phone: formattedPhone,
    code_hash: codeHash,
    expires_at: expiresAt,
  });

  const message = `AnıBaskı doğrulama kodunuz: ${code}\n\nBu kod 10 dakika geçerlidir. Kodunuzu kimseyle paylaşmayın.`;
  const result = await sendSms({ phone: formattedPhone, message });

  if (!result.ok) {
    return NextResponse.json({ error: "Kod gönderilemedi. Lütfen tekrar deneyin." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    provider: result.provider,
    // Mock modunda (Netgsm yokken) kodu UI'da göster — yalnız non-production (local + Vercel preview).
    // Vercel'de NODE_ENV hep "production" olduğundan VERCEL_ENV ile preview'ı ayırt ederiz; canlıda gizli.
    ...(result.provider === "mock" && process.env.VERCEL_ENV !== "production" ? { _devCode: code } : {}),
  });
}
