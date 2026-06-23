"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

export default function AccountDeleteRequest() {
  const [step, setStep] = useState<"idle" | "confirm" | "loading" | "done">("idle");
  const { toast } = useToast();

  async function handleRequest() {
    setStep("loading");
    const res = await fetch("/api/profile/delete-request", { method: "POST" });
    if (res.ok) {
      setStep("done");
    } else {
      toast("Talep gönderilemedi. Lütfen tekrar deneyin.", "error");
      setStep("idle");
    }
  }

  if (step === "done") {
    return (
      <p className="text-sm text-text-light bg-bg border border-border rounded-xl px-5 py-4">
        Hesap silme talebiniz alındı. En kısa sürede tarafınıza dönüş yapacağız.
      </p>
    );
  }

  if (step === "confirm" || step === "loading") {
    return (
      <div className="border border-red-200 bg-red-50 rounded-xl px-5 py-4 flex flex-col gap-3">
        <p className="text-sm text-red-800 font-semibold">Hesabınızı silmek istediğinizden emin misiniz?</p>
        <p className="text-xs text-red-700 leading-relaxed">
          Talebiniz yöneticiye iletilecektir. Hesabınız ve kişisel verileriniz
          KVKK kapsamında silinecek; bu işlem geri alınamaz.
          Aktif siparişleriniz varsa önce tamamlanmalarını bekleyin.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleRequest}
            disabled={step === "loading"}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-full transition-colors"
          >
            {step === "loading" ? "Gönderiliyor..." : "Evet, Talep Gönder"}
          </button>
          <button
            onClick={() => setStep("idle")}
            disabled={step === "loading"}
            className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-100 disabled:opacity-50 text-xs font-semibold rounded-full transition-colors"
          >
            Vazgeç
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setStep("confirm")}
      className="text-xs text-red-500 hover:text-red-700 hover:underline underline-offset-2 transition-colors text-left"
    >
      Hesabımı silmek istiyorum
    </button>
  );
}
