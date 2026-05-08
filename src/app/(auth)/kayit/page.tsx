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
        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-soft)] p-8 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="font-serif text-xl text-[var(--color-text)] mb-2">E-postanı doğrula</h2>
          <p className="text-sm text-[var(--color-text-light)] mb-6">
            <strong>{email}</strong> adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsin.
          </p>
          <Link
            href="/giris"
            className="inline-block px-6 py-2.5 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-full hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Giriş sayfasına git
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-soft)] p-8">
        <h1 className="font-serif text-2xl text-[var(--color-text)] mb-1">Hesap Oluştur</h1>
        <p className="text-sm text-[var(--color-text-light)] mb-8">
          Zaten hesabın var mı?{" "}
          <Link href="/giris" className="text-[var(--color-primary)] hover:underline font-semibold">
            Giriş yap
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[var(--color-text)]">Ad Soyad</label>
            <input
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="Adınız Soyadınız"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[var(--color-text)]">E-posta</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="ornek@mail.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[var(--color-text)]">Şifre</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors"
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
            className="mt-2 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60 text-white font-semibold rounded-full transition-colors"
          >
            {loading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
          </button>
        </form>
      </div>
    </div>
  );
}
