"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  userId: string;
  userName: string;
};

export default function UserDelete({ userId, userName }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`"${userName}" üyesini silmek istediğine emin misin?\n\nBu işlem geri alınamaz. Üyenin adresleri, sepeti ve favorileri de silinecek.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Silinemedi.");
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs text-red-500 hover:text-red-700 font-semibold disabled:opacity-60"
    >
      {deleting ? "Siliniyor..." : "Sil"}
    </button>
  );
}
