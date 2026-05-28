import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const MAX_ATTEMPTS = 3;

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Geçerli bir 6 haneli kod girin." }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // En yeni doğrulanmamış kodu çek
  const { data: verification } = await adminClient
    .from("phone_verifications")
    .select("id, code_hash, attempts, expires_at, verified_at")
    .eq("user_id", user.id)
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!verification) {
    return NextResponse.json({ error: "Doğrulama kodu bulunamadı. Lütfen yeni kod isteyin." }, { status: 400 });
  }

  if (new Date(verification.expires_at) < new Date()) {
    return NextResponse.json({ error: "Kodun süresi doldu. Lütfen yeni kod isteyin." }, { status: 400 });
  }

  if (verification.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Çok fazla yanlış deneme. Lütfen yeni kod isteyin." }, { status: 400 });
  }

  if (hashCode(code) !== verification.code_hash) {
    await adminClient
      .from("phone_verifications")
      .update({ attempts: verification.attempts + 1 })
      .eq("id", verification.id);

    const remaining = MAX_ATTEMPTS - (verification.attempts + 1);
    return NextResponse.json(
      { error: `Hatalı kod. ${remaining > 0 ? `${remaining} deneme hakkınız kaldı.` : "Lütfen yeni kod isteyin."}` },
      { status: 400 }
    );
  }

  // Başarılı doğrulama
  await Promise.all([
    adminClient
      .from("phone_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verification.id),
    adminClient
      .from("profiles")
      .update({ phone_verified: true })
      .eq("id", user.id),
  ]);

  return NextResponse.json({ ok: true });
}
