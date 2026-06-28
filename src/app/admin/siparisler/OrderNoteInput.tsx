"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

export default function OrderNoteInput({
  orderId,
  currentNote,
}: {
  orderId: string;
  currentNote: string | null;
}) {
  const [note, setNote] = useState(currentNote ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!currentNote);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${orderId}/note`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note.trim() || null }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      toast("Not kaydedilemedi.", "error");
    }
  }

  const dirty = note !== (currentNote ?? "");

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-text-light uppercase tracking-wider">İç Not</label>
      <div className="flex gap-2 items-end">
        <textarea
          value={note}
          onChange={(e) => { setNote(e.target.value); setSaved(false); }}
          placeholder="Yalnızca admin görür…"
          rows={2}
          className="flex-1 text-xs px-2.5 py-2 rounded-lg border border-border bg-white text-text outline-none focus:border-primary transition-colors resize-none"
        />
        {saved && !dirty ? (
          <span className="text-xs text-green-600 font-semibold shrink-0 pb-1">✓ Kaydedildi</span>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="shrink-0 text-xs px-3 py-1.5 bg-primary text-white rounded-lg font-semibold disabled:opacity-40 hover:bg-primary-hover transition-colors"
          >
            {saving ? "..." : "Kaydet"}
          </button>
        )}
      </div>
    </div>
  );
}
