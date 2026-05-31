"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DuplicateButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDuplicate() {
    setLoading(true);
    const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: "POST" });
    if (res.ok) {
      const { id: newId } = await res.json();
      router.push(`/admin/urunler/${newId}/duzenle`);
    } else {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      className="text-xs text-text-light hover:text-primary disabled:opacity-50 transition-colors font-semibold"
    >
      {loading ? "…" : "Çoğalt"}
    </button>
  );
}
