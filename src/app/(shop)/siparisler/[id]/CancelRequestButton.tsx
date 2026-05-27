"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

export default function CancelRequestButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleCancel() {
    setLoading(true);
    const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
    if (res.ok) {
      toast("İptal talebiniz alındı. En kısa sürede değerlendireceğiz.", "success");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error ?? "İptal talebi gönderilemedi.", "error");
    }
    setLoading(false);
    setConfirmed(false);
  }

  if (!confirmed) {
    return (
      <button
        onClick={() => setConfirmed(true)}
        className="text-sm text-red-600 hover:text-red-700 font-semibold underline underline-offset-2 transition-colors"
      >
        İptal Talep Et
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
      <p className="text-sm text-red-700 flex-1">
        Siparişinizi iptal etmek istediğinizden emin misiniz?
      </p>
      <button
        onClick={handleCancel}
        disabled={loading}
        className="text-xs font-semibold px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Gönderiliyor..." : "Evet, İptal Et"}
      </button>
      <button
        onClick={() => setConfirmed(false)}
        disabled={loading}
        className="text-xs font-semibold px-3 py-1.5 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
      >
        Vazgeç
      </button>
    </div>
  );
}
