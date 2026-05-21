"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SifremiSifirlaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("Şifre güncellenemedi. Bağlantı süresi dolmuş olabilir.");
      setLoading(false);
      return;
    }

    router.push("/giris?bilgi=Şifreniz güncellendi. Giriş yapabilirsiniz.");
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl border border-border shadow-soft p-8">
        <h1 className="font-serif text-2xl text-text mb-1">Yeni Şifre Belirle</h1>
        <p className="text-sm text-text-light mb-8">
          Hesabınız için yeni bir şifre oluşturun.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Yeni Şifre</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-border bg-bg text-text text-sm outline-none focus:border-primary transition-colors"
              placeholder="En az 6 karakter"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Şifre Tekrar</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-border bg-bg text-text text-sm outline-none focus:border-primary transition-colors"
              placeholder="Şifreyi tekrar girin"
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
            {loading ? "Kaydediliyor..." : "Şifremi Güncelle"}
          </button>
        </form>
      </div>
    </div>
  );
}
