import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const errorParam = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");
  const redirect = searchParams.get("redirect") ?? "/";

  // Supabase OAuth hatası (ör. signup kapalı, erişim reddedildi)
  if (errorParam) {
    const msg = encodeURIComponent(errorDesc ?? errorParam);
    return NextResponse.redirect(`${origin}/giris?error=${msg}`);
  }

  const tokenHash = searchParams.get("token_hash");
  if (!code && !tokenHash) {
    return NextResponse.redirect(`${origin}/giris?error=Kod+bulunamadi`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // token_hash akışı (cross-device şifre sıfırlama için)
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: (type as "recovery" | "email" | "signup" | "magiclink" | "email_change") ?? "recovery",
    });

    if (error) {
      const msg = encodeURIComponent(error.message);
      return NextResponse.redirect(`${origin}/giris?error=${msg}`);
    }

    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/sifremi-sifirla`);
    }

    return NextResponse.redirect(`${origin}${redirect}`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code!);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    const msg = encodeURIComponent(error.message);
    return NextResponse.redirect(`${origin}/giris?error=${msg}`);
  }

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/sifremi-sifirla`);
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
