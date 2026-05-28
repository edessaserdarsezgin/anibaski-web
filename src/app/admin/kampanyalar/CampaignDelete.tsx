"use client";

import { useRouter } from "next/navigation";

export default function CampaignDelete({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Bu kampanyayı silmek istediğine emin misin?")) return;
    const res = await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Silinemedi.");
  }

  return (
    <button onClick={handleDelete} className="text-xs text-red-500 hover:underline font-semibold">
      Sil
    </button>
  );
}
