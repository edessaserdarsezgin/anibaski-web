"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/auth/PasswordInput";

export default function PasswordChangeForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (next.length < 6) {
      setError("Yeni şifre en az 6 karakter olmalı.");
      return;
    }
    if (next !== confirm) {
      setError("Yeni şifreler eşleşmiyor.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    // Mevcut şifreyi doğrula
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setError("Kullanıcı bulunamadı."); setSaving(false); return; }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (signInErr) {
      setError("Mevcut şifre yanlış.");
      setSaving(false);
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: next });
    if (updateErr) {
      setError("Şifre güncellenemedi: " + updateErr.message);
    } else {
      setSuccess(true);
      setCurrent("");
      setNext("");
      setConfirm("");
      setTimeout(() => setSuccess(false), 4000);
    }
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-6 mt-6">
      <h2 className="text-base font-semibold text-text mb-4">Şifre Değiştir</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Mevcut Şifre</label>
          <PasswordInput
            value={current}
            onChange={setCurrent}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Yeni Şifre</label>
          <PasswordInput
            value={next}
            onChange={setNext}
            autoComplete="new-password"
            placeholder="En az 6 karakter"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Yeni Şifre (Tekrar)</label>
          <PasswordInput
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
            Şifreniz başarıyla güncellendi.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="self-start px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
        >
          {saving ? "Güncelleniyor..." : "Şifremi Güncelle"}
        </button>
      </form>
    </div>
  );
}
