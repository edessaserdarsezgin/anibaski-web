"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

/** Sipariş fotoğraflarını R2'den anında siler (durumdan bağımsız).
 *  purged=true ise buton yerine "silindi" bilgisi gösterir. */
export default function DeletePhotosButton({ orderId, purged }: { orderId: string; purged: boolean }) {
  const [done, setDone] = useState(purged);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  if (done) {
    return <span className="text-xs text-text-light font-semibold">📸 Fotoğraflar silindi</span>;
  }

  async function handleDelete() {
    if (!confirm("Bu siparişin müşteri fotoğrafları kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/photos`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setDone(true);
        toast(`Fotoğraflar silindi${data.deletedFiles ? ` (${data.deletedFiles} dosya)` : ""}.`);
      } else {
        toast("Fotoğraflar silinemedi.", "error");
      }
    } catch {
      toast("Fotoğraflar silinemedi.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="text-xs text-red-500 hover:text-red-600 disabled:opacity-60 font-semibold"
    >
      {busy ? "Siliniyor…" : "🗑 Fotoğrafları sil"}
    </button>
  );
}
