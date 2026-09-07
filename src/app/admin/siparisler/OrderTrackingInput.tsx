"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import CustomSelect from "@/components/ui/CustomSelect";
import { CARRIER_OPTIONS } from "@/lib/shipping/carrier/registry";

export default function OrderTrackingInput({
  orderId,
  currentCode,
  currentCarrier,
}: {
  orderId: string;
  currentCode: string | null;
  currentCarrier: string | null;
}) {
  const [code, setCode] = useState(currentCode ?? "");
  const [carrier, setCarrier] = useState(currentCarrier ?? "aras");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!currentCode);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSave() {
    if (!code.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${orderId}/tracking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingCode: code, carrier }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      toast("Kargo kodu kaydedildi, müşteriye e-posta gönderildi.");
      router.refresh();
    } else {
      toast("Kargo kodu kaydedilemedi.", "error");
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <CustomSelect
        value={carrier}
        onChange={(v) => { setCarrier(v); setSaved(false); }}
        options={CARRIER_OPTIONS}
        ariaLabel="Kargo firması"
        className="w-32"
      />
      <input
        type="text"
        value={code}
        onChange={(e) => { setCode(e.target.value); setSaved(false); }}
        placeholder="Takip kodu"
        className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-white text-text outline-none focus:border-primary transition-colors w-32"
      />
      {saved ? (
        <span className="text-xs text-green-600 font-semibold">✓ Gönderildi</span>
      ) : (
        <button
          onClick={handleSave}
          disabled={saving || !code.trim()}
          className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-primary-hover transition-colors"
        >
          {saving ? "..." : "Kaydet"}
        </button>
      )}
    </div>
  );
}
