"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CampaignToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(active);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const next = !on;
    const res = await fetch(`/api/admin/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: next }),
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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        on ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
