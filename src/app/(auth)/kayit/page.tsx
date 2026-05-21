"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function KayitPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setError(error.message === "User already registered"
        ? "Bu e-posta adresi zaten kayıtlı."
        : "Kayıt sırasında bir hata oluştu.");
      setLoading(false);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-border shadow-soft p-8 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="font-serif text-xl text-text mb-2">E-postanı doğrula</h2>
          <p className="text-sm text-text-light mb-6">
            <strong>{email}</strong> adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsin.
          </p>
          <Link
            href="/giris"
            className="inline-block px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary-hover transition-colors"
          >
            Giriş sayfasına git
          </Link>
        </div>
      </div>
    );
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl border border-border shadow-soft p-8">
        <h1 className="font-serif text-2xl text-text mb-1">Hesap Oluştur</h1>
        <p className="text-sm text-text-light mb-8">
          Zaten hesabın var mı?{" "}
          <Link href="/giris" className="text-primary hover:underline font-semibold">
            Giriş yap
          </Link>
        </p>

        <button
          type="button"
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 py-2.5 border border-border rounded-full text-sm font-semibold text-text hover:bg-gray-50 transition-colors mb-6"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google ile Kayıt Ol
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-light">veya e-posta ile</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Ad Soyad</label>
            <input
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-border bg-bg text-text text-sm outline-none focus:border-primary transition-colors"
              placeholder="Adınız Soyadınız"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">E-posta</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-border bg-bg text-text text-sm outline-none focus:border-primary transition-colors"
              placeholder="ornek@mail.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Şifre</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-border bg-bg text-text text-sm outline-none focus:border-primary transition-colors"
              placeholder="En az 6 karakter"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold rounded-full transition-colors"
          >
            {loading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
          </button>
        </form>
      </div>
    </div>
  );
}
