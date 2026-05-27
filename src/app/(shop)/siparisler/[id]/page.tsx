import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import OrderStatusSelect from "./OrderStatusSelect";
import CancelRequestButton from "./CancelRequestButton";

type Props = { params: Promise<{ id: string }> };

const STATUS_STEPS = ["PENDING", "PREPARING", "SHIPPED", "DELIVERED"];
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Beklemede", PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoda", DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal Edildi", CANCEL_REQUESTED: "İptal Talebi İnceleniyor",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-yellow-700 bg-yellow-50 border-yellow-200",
  PREPARING: "text-blue-700 bg-blue-50 border-blue-200",
  SHIPPED: "text-purple-700 bg-purple-50 border-purple-200",
  DELIVERED: "text-green-700 bg-green-50 border-green-200",
  CANCELLED: "text-red-700 bg-red-50 border-red-200",
  CANCEL_REQUESTED: "text-orange-700 bg-orange-50 border-orange-200",
};
const PAYMENT_LABEL: Record<string, string> = {
  credit_card: "Kredi / Banka Kartı",
  cod: "Kapıda Ödeme",
};

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  variantSelections: Record<string, { label: string; type?: string }> | null;
  uploadedImages: string[];
  product: { name: string; images: string[]; slug: string } | null;
};

export default async function SiparisDetayPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/giris?redirect=/siparisler/${id}`);

  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*, product:products(name, images, slug)), address:addresses!orders_addressId_fkey(*), billingAddress:addresses!orders_billingAddressId_fkey(*)")
    .eq("id", id)
    .single();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "ADMIN";
  if (!order || (!isAdmin && order.userId !== user.id)) notFound();

  const isCancelled = order.status === "CANCELLED";
  const isCancelRequested = order.status === "CANCEL_REQUESTED";
  // CANCEL_REQUESTED = müşteri beklemede iken iptal istedi → adım 0 (PENDING) olarak göster
  const displayStatus = isCancelRequested ? "PENDING" : order.status;
  const currentStep = isCancelled ? -1 : STATUS_STEPS.indexOf(displayStatus);
  const items: OrderItem[] = order.items ?? [];

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">

      {/* Başlık */}
      <div className="mb-8">
        <p className="text-sm text-text-light mb-2">
          <Link href="/siparisler" className="hover:text-primary">
            {isAdmin ? "← Admin / Siparişler" : "← Siparişlerim"}
          </Link>
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl text-text">
              Sipariş #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-sm text-text-light mt-1">
              {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          {isAdmin ? (
            <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
          ) : (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold px-4 py-1.5 rounded-full border ${STATUS_COLOR[displayStatus]}`}>
                  {STATUS_LABEL[displayStatus]}
                </span>
                {isCancelRequested && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full border text-orange-700 bg-orange-50 border-orange-200">
                    ⚠ İptal Talebi
                  </span>
                )}
              </div>
              {order.status === "PENDING" && (
                <CancelRequestButton orderId={order.id} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Durum çizelgesi */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-6">
        <h2 className="font-serif text-lg text-text mb-6">Sipariş Durumu</h2>
        {isCancelled ? (
          <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            Bu sipariş iptal edildi.
          </p>
        ) : (
          <>
          {isCancelRequested && (
            <p className="text-sm font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-5">
              ⚠ İptal talebiniz inceleniyor. En kısa sürede bilgilendireceğiz.
            </p>
          )}
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                      done ? "border-primary bg-primary text-white" : "border-border text-text-light"
                    }`}>
                      {done && !active ? "✓" : i + 1}
                    </div>
                    <p className={`text-xs font-semibold text-center whitespace-nowrap ${
                      active ? "text-primary" : done ? "text-text" : "text-text-light"
                    }`}>
                      {STATUS_LABEL[step]}
                    </p>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < currentStep ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sol: Ürünler */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-serif text-lg text-text mb-5">
              Ürünler <span className="text-sm font-normal text-text-light">({items.length} kalem)</span>
            </h2>
            <div className="flex flex-col gap-5">
              {items.map((item) => {
                const variantEntries = item.variantSelections
                  ? Object.entries(item.variantSelections)
                  : [];
                return (
                  <div key={item.id} className="flex gap-4 pb-5 border-b border-border last:border-0 last:pb-0">
                    <div className="relative w-20 h-20 rounded-xl bg-bg border border-border flex-shrink-0 overflow-hidden">
                      {item.product?.images?.[0]
                        ? <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="80px" />
                        : <div className="w-full h-full" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.product?.slug ? (
                        <Link href={`/urunler/${item.product.slug}`}
                          className="font-serif text-text hover:text-primary transition-colors">
                          {item.product.name}
                        </Link>
                      ) : (
                        <p className="font-serif text-text">{item.product?.name}</p>
                      )}

                      {variantEntries.length > 0 && (
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                          {variantEntries.map(([type, v]) => (
                            <span key={type} className="text-xs text-text-light">
                              <span className="capitalize">{type}:</span>{" "}
                              <span className="font-semibold text-text">{v.label}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-text-light">
                          {item.quantity} adet × {Number(item.unitPrice).toLocaleString("tr-TR")} ₺
                        </span>
                        <span className="font-semibold text-primary">
                          {(Number(item.unitPrice) * item.quantity).toLocaleString("tr-TR")} ₺
                        </span>
                      </div>

                      {/* Yüklenen fotoğraflar */}
                      {item.uploadedImages?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-text-light mb-2">
                            Yüklenen Fotoğraflar ({item.uploadedImages.length} adet)
                          </p>
                          <div className="grid grid-cols-5 gap-1.5">
                            {item.uploadedImages.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                className="relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors group">
                                <Image src={url} alt={`Fotoğraf ${i + 1}`} fill className="object-cover" sizes="20vw" />
                                {isAdmin && (
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                  </div>
                                )}
                              </a>
                            ))}
                          </div>
                          {isAdmin && (
                            <a
                              href={`/api/admin/orders/${order.id}/photos/download`}
                              className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-primary hover:underline"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                              Tüm fotoğrafları ZIP indir
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sağ: Özet + Adres + Ödeme */}
        <div className="flex flex-col gap-4">

          {/* Fiyat özeti */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-serif text-lg text-text mb-4">Ödeme Özeti</h2>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-light">Ara toplam</span>
                <span>{Number(order.subtotal).toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-light">Kargo</span>
                <span>
                  {Number(order.shippingFee) === 0
                    ? <span className="text-green-600">Ücretsiz</span>
                    : `${Number(order.shippingFee).toLocaleString("tr-TR")} ₺`}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-semibold text-base">
                <span>Toplam</span>
                <span className="text-primary">{Number(order.total).toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-text-light">Ödeme yöntemi</p>
              <p className="text-sm font-semibold text-text mt-0.5">
                {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
              </p>
            </div>
          </div>

          {/* Teslimat adresi */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-serif text-lg text-text mb-3">Teslimat Adresi</h2>
            <div className="text-sm flex flex-col gap-1">
              <p className="font-semibold text-text">{order.address?.fullName}</p>
              <p className="text-text-light">{order.address?.phone}</p>
              <p className="text-text-light mt-1">{order.address?.address}</p>
              <p className="text-text-light">
                {order.address?.district}, {order.address?.city}
                {order.address?.zip ? ` ${order.address.zip}` : ""}
              </p>
            </div>
          </div>

          {/* Fatura adresi */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-serif text-lg text-text mb-3">Fatura Adresi</h2>
            {order.billingAddress && order.billingAddressId !== order.addressId ? (
              <div className="text-sm flex flex-col gap-1">
                <p className="font-semibold text-text">{order.billingAddress.fullName}</p>
                <p className="text-text-light">{order.billingAddress.phone}</p>
                <p className="text-text-light mt-1">{order.billingAddress.address}</p>
                <p className="text-text-light">
                  {order.billingAddress.district}, {order.billingAddress.city}
                  {order.billingAddress.zip ? ` ${order.billingAddress.zip}` : ""}
                </p>
              </div>
            ) : (
              <p className="text-sm text-text-light">Teslimat adresiyle aynı</p>
            )}
          </div>

          {/* Sipariş bilgileri */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-serif text-lg text-text mb-3">Sipariş Bilgileri</h2>
            <div className="flex flex-col gap-2 text-sm">
              <div>
                <p className="text-xs text-text-light">Sipariş No</p>
                <p className="font-mono font-semibold text-text">#{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs text-text-light">Tarih</p>
                <p className="text-text">
                  {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-light">Saat</p>
                <p className="text-text">
                  {new Date(order.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
