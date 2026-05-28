"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SifremiUnuttumPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      const isRateLimit =
        error.message.toLowerCase().includes("rate limit") ||
        error.message.toLowerCase().includes("over_email_send_rate_limit") ||
        error.status === 429;
      setError(
        isRateLimit
          ? "Çok sık istek gönderdiniz. Lütfen 60 saniye bekleyip tekrar deneyin."
          : "Bir hata oluştu. Lütfen tekrar deneyin."
      );
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white/93 backdrop-blur-md rounded-2xl border border-white/40 shadow-2xl p-8">
        <h1 className="font-serif text-2xl text-text mb-1">Şifremi Unuttum</h1>
        <p className="text-sm text-text-light mb-8">
          E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz.
        </p>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-text mb-1">E-posta gönderildi!</p>
            <p className="text-sm text-text-light mb-6">
              <span className="font-medium">{email}</span> adresine şifre sıfırlama bağlantısı gönderdik.
            </p>
            <Link href="/giris" className="text-sm text-primary hover:underline font-semibold">
              Giriş sayfasına dön
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
            </button>

            <p className="text-center text-sm text-text-light">
              <Link href="/giris" className="text-primary hover:underline font-semibold">
                Giriş sayfasına dön
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
