"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CampaignHomeToggle({ id, on: initial }: { id: string; on: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const next = !on;
    const res = await fetch(`/api/admin/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ show_on_home: next }),
    });
    setSaving(false);
    if (res.ok) {
      setOn(next);
      router.refresh();
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? "bg-primary" : "bg-gray-300"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}
