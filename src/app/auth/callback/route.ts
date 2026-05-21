import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");
  const redirect = searchParams.get("redirect") ?? "/";

  // Supabase OAuth hatası (ör. signup kapalı, erişim reddedildi)
  if (errorParam) {
    const msg = encodeURIComponent(errorDesc ?? errorParam);
    return NextResponse.redirect(`${origin}/giris?error=${msg}`);
  }

  if (!code) {
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    const msg = encodeURIComponent(error.message);
    return NextResponse.redirect(`${origin}/giris?error=${msg}`);
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
