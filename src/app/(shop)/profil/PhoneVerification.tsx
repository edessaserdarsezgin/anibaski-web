"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  phone: string | null;
  verified: boolean;
};

export default function PhoneVerification({ phone, verified }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");

  if (!phone) return null;

  if (verified) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 self-start">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Telefon doğrulandı
      </div>
    );
  }

  async function handleSend() {
    setSending(true);
    setError("");
    setInfo("");
    setDevCode("");

    const res = await fetch("/api/auth/phone/send-otp", { method: "POST" });
    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(data.error ?? "Kod gönderilemedi.");
      return;
    }
    setOpen(true);
    setInfo("Telefon numaranıza 6 haneli doğrulama kodu gönderildi.");
    if (data._devCode) setDevCode(data._devCode);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Lütfen 6 haneli kodu girin.");
      return;
    }
    setVerifying(true);
    setError("");

    const res = await fetch("/api/auth/phone/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setVerifying(false);

    if (!res.ok) {
      setError(data.error ?? "Doğrulama başarısız.");
      return;
    }
    setOpen(false);
    setCode("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-3 py-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          Telefon doğrulanmadı
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="text-xs font-semibold text-primary hover:underline disabled:opacity-60"
        >
          {sending ? "Gönderiliyor..." : "Şimdi doğrula"}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-serif text-lg text-text">Telefonu Doğrula</h3>
              <button onClick={() => setOpen(false)} className="text-text-light hover:text-text text-2xl leading-none">
                ×
              </button>
            </div>
            <form onSubmit={handleVerify} className="px-6 py-5 flex flex-col gap-4">
              <p className="text-sm text-text-light">
                <strong className="text-text">{phone}</strong> numaranıza gönderdiğimiz 6 haneli kodu girin.
              </p>
              {info && <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{info}</p>}
              {devCode && (
                <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 font-mono">
                  🛠 Dev modu — Kod: <strong>{devCode}</strong>
                </p>
              )}
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="• • • • • •"
                className="px-4 py-3 rounded-lg border border-border bg-bg text-center text-2xl font-mono tracking-[0.5em] outline-none focus:border-primary"
              />
              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending}
                  className="flex-1 py-2.5 border border-border text-text text-sm font-semibold rounded-full hover:bg-bg disabled:opacity-60 transition-colors"
                >
                  Tekrar gönder
                </button>
                <button
                  type="submit"
                  disabled={verifying || code.length !== 6}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-colors"
                >
                  {verifying ? "Doğrulanıyor..." : "Doğrula"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
