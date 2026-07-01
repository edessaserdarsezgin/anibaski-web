import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/server";
import { signUploadedImages } from "@/lib/uploads";
import MakbuzActions from "./MakbuzActions";

export const metadata = { title: "İş Makbuzu | Admin" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Beklemede", PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoda", DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal", CANCEL_REQUESTED: "İptal Talebi",
};
// İş akışında elle işaretlenecek süreç adımları
const STEPS = ["Hazırlanıyor", "Baskı", "Kontrol", "Paketleme", "Kargo", "Teslim"];

type Props = { params: Promise<{ id: string }> };

export default async function MakbuzPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select(`id, status, total, createdAt, "trackingCode", "adminNote", type,
      items:order_items(id, quantity, variantSelections, uploadedImages, product:products(name)),
      address:addresses!orders_addressId_fkey(fullName, phone, address, city, district, zip),
      buyer:profiles!orders_userId_fkey(fullName, phone, email)`)
    .eq("id", id)
    .single();

  if (!order) notFound();

  // Yüklenen fotoğrafları imzala (R2) — PREPARING'e geçmişse silinmiş olabilir
  const items = await Promise.all(
    (order.items ?? []).map(async (it) => ({
      ...it,
      signed: await signUploadedImages(it.uploadedImages as string[] | null),
    }))
  );

  const address = order.address as unknown as { fullName: string; phone: string; address: string; city: string; district: string; zip: string | null } | null;
  const buyer = order.buyer as unknown as { fullName: string | null; phone: string | null; email: string } | null;
  const orderNo = order.id.slice(0, 8).toUpperCase();

  // QR: siparişe hızlı ulaşım (telefonla okut)
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://anibaski.com";
  const qrDataUrl = await QRCode.toDataURL(`${base}/siparisler/${order.id}?from=admin`, { margin: 1, width: 220 });

  const printCss = `
    @media print {
      @page { size: A4; margin: 12mm; }
      body * { visibility: hidden !important; }
      #makbuz, #makbuz * { visibility: visible !important; }
      #makbuz { position: absolute; left: 0; top: 0; width: 100%; }
      .no-print { display: none !important; }
    }
  `;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <style dangerouslySetInnerHTML={{ __html: printCss }} />
      <MakbuzActions />

      <div id="makbuz" className="bg-white text-black border border-black/20 rounded-lg p-6 print:border-0 print:rounded-none">
        {/* Başlık + QR */}
        <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-4">
          <div>
            <p className="text-2xl font-bold">AnıBaskı</p>
            <p className="text-sm uppercase tracking-wide text-black/60">İş Emri / Makbuz</p>
            <p className="mt-2 text-3xl font-mono font-bold">#{orderNo}</p>
          </div>
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Sipariş QR" width={110} height={110} />
            <p className="text-[10px] text-black/50 mt-1">okut → sipariş</p>
          </div>
        </div>

        {/* Meta satırı */}
        <div className="grid grid-cols-3 gap-3 text-sm mb-4">
          <div>
            <p className="text-black/50 text-xs">Sipariş Tarihi</p>
            <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString("tr-TR")}</p>
          </div>
          <div>
            <p className="text-black/50 text-xs">Durum</p>
            <p className="font-semibold">{STATUS_LABEL[order.status] ?? order.status}</p>
          </div>
          <div>
            <p className="text-black/50 text-xs">Tür</p>
            <p className="font-semibold">{order.type === "reprint" ? "Yeniden Baskı" : "Standart"}</p>
          </div>
        </div>

        {/* Müşteri + teslimat */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div className="border border-black/20 rounded p-3">
            <p className="text-black/50 text-xs mb-1">Müşteri</p>
            <p className="font-semibold">{buyer?.fullName || buyer?.email || "—"}</p>
            {buyer?.phone && <p>{buyer.phone}</p>}
          </div>
          <div className="border border-black/20 rounded p-3">
            <p className="text-black/50 text-xs mb-1">Teslim Adresi</p>
            <p className="font-semibold">{address?.fullName ?? "—"}{address?.phone ? ` · ${address.phone}` : ""}</p>
            {address && <p className="text-xs">{address.address}, {address.district} / {address.city} {address.zip ?? ""}</p>}
          </div>
        </div>

        {/* Ürünler */}
        <table className="w-full text-sm border border-black/20 mb-4">
          <thead>
            <tr className="bg-black/5 text-left">
              <th className="px-2 py-1.5 w-8">#</th>
              <th className="px-2 py-1.5">Ürün</th>
              <th className="px-2 py-1.5">Seçenekler</th>
              <th className="px-2 py-1.5 w-12 text-center">Adet</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const product = it.product as unknown as { name: string } | null;
              const variants = it.variantSelections as Record<string, { label: string }> | null;
              const variantText = variants && Object.keys(variants).length > 0
                ? Object.values(variants).map((v) => v.label).join(", ") : "—";
              return (
                <tr key={it.id} className="border-t border-black/10 align-top">
                  <td className="px-2 py-2">{i + 1}</td>
                  <td className="px-2 py-2">
                    <p className="font-semibold">{product?.name ?? "—"}</p>
                    {it.signed.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {it.signed.map((url, j) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={j} src={url} alt="" width={44} height={44} className="w-11 h-11 object-cover border border-black/20 rounded" />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2">{variantText}</td>
                  <td className="px-2 py-2 text-center font-semibold">{it.quantity}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Admin iç not */}
        {order.adminNote && (
          <div className="border border-black/20 rounded p-3 text-sm mb-4">
            <p className="text-black/50 text-xs mb-1">İç Not</p>
            <p>{order.adminNote as string}</p>
          </div>
        )}

        {/* Süreç takip kutucukları */}
        <div className="border-t-2 border-black pt-3">
          <p className="text-xs text-black/50 mb-2">Süreç Takibi (elle işaretle)</p>
          <div className="flex flex-wrap gap-4 text-sm">
            {STEPS.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span className="inline-block w-4 h-4 border-2 border-black rounded-sm" /> {s}
              </span>
            ))}
          </div>
          <div className="mt-3 text-sm">
            <span className="text-black/50 text-xs">Kargo Kodu: </span>
            <span className="font-mono">{(order.trackingCode as string | null) || "____________________"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
