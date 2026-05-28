"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  userId: string;
  currentRole: string;
  colorMap: Record<string, string>;
};

export default function RoleSelect({ userId, currentRole, colorMap }: Props) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value;
    if (!confirm(`Bu üyenin rolünü '${newRole}' yapmak istediğine emin misin?`)) return;
    setSaving(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Rol güncellenemedi.");
      return;
    }
    setRole(newRole);
    router.refresh();
  }

  return (
    <select
      value={role}
      onChange={handleChange}
      disabled={saving}
      className={`text-xs font-semibold px-3 py-1 rounded-full border outline-none cursor-pointer ${colorMap[role] ?? colorMap.CUSTOMER}`}
    >
      <option value="CUSTOMER">CUSTOMER</option>
      <option value="ADMIN">ADMIN</option>
    </select>
  );
}
