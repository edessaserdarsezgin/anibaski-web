"use client";

import { useState } from "react";
import LegalModal from "./LegalModal";
import CaymaHakkiDoc from "./CaymaHakkiDoc";
import OnBilgilendirmeDoc from "./OnBilgilendirmeDoc";
import MesafeliSatisDoc from "./MesafeliSatisDoc";
import type { LegalDocProps, LegalDocBuyer, LegalDocItem } from "./types";

type OrderAddress = {
  fullName: string; phone: string; address: string;
  district: string; city: string; zip?: string | null;
};
type OrderItem = {
  quantity: number;
  unitPrice: number;
  variantSelections: Record<string, { label: string }> | null;
  product: { name: string } | null;
};

type Props = {
  order: {
    id: string;
    createdAt: string;
    subtotal: number;
    shippingFee: number;
    total: number;
    discount_code?: string | null;
    discount_amount?: number | null;
    items: OrderItem[];
    address: OrderAddress | null;
  };
  buyer: { email: string; fullName?: string | null; phone?: string | null } | null;
};

type ModalKey = "cayma" | "on-bilgilendirme" | "mesafeli";

const MODAL_LABELS: Record<ModalKey, string> = {
  "cayma": "Cayma Hakkı",
  "on-bilgilendirme": "Ön Bilgilendirme Formu",
  "mesafeli": "Mesafeli Satış Sözleşmesi",
};

export default function LegalAccordion({ order, buyer }: Props) {
  const [modal, setModal] = useState<ModalKey | null>(null);

  if (!order.address) return null;

  const legalBuyer: LegalDocBuyer = {
    fullName: buyer?.fullName || order.address.fullName,
    email: buyer?.email ?? "",
    phone: order.address.phone,
    address: order.address.address,
    district: order.address.district,
    city: order.address.city,
    zip: order.address.zip,
  };

  const legalItems: LegalDocItem[] = order.items.map(item => ({
    name: item.product?.name ?? "Ürün",
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    variantLabel: item.variantSelections
      ? Object.values(item.variantSelections).map(v => v.label).join(", ") || undefined
      : undefined,
  }));

  const docDate = new Date(order.createdAt).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  const sharedProps: LegalDocProps = {
    buyer: legalBuyer,
    items: legalItems,
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shippingFee),
    discountCode: order.discount_code,
    discountAmount: Number(order.discount_amount ?? 0),
    total: Number(order.total),
    date: docDate,
    orderNumber: order.id.slice(0, 8).toUpperCase(),
  };

  return (
    <>
      <div className="flex flex-col divide-y divide-border">
        {(["cayma", "on-bilgilendirme", "mesafeli"] as ModalKey[]).map(key => (
          <div key={key} className="flex items-center justify-between py-2.5">
            <span className="text-sm text-text">{MODAL_LABELS[key]}</span>
            <button
              onClick={() => setModal(key)}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Oku →
            </button>
          </div>
        ))}
      </div>

      {modal && (
        <LegalModal title={MODAL_LABELS[modal]} onClose={() => setModal(null)}>
          {modal === "cayma" && <CaymaHakkiDoc {...sharedProps} />}
          {modal === "on-bilgilendirme" && <OnBilgilendirmeDoc {...sharedProps} />}
          {modal === "mesafeli" && <MesafeliSatisDoc {...sharedProps} />}
        </LegalModal>
      )}
    </>
  );
}
