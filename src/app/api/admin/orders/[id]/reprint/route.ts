import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

type ReprintItem = { orderItemId: string; quantity: number };

/**
 * Tekrar baskı (reprint) — admin aksiyonu, satış değil fulfillment.
 * Orijinal siparişin seçili kalemlerinden ücretsiz (total=0) yeni bir reprint
 * siparişi türetir. PayTR'ye girmez; paymentStatus='paid'.
 * Foto'lar retention ile silinmişse (photosPurgedAt dolu) reddedilir.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { items, reason } = (await req.json()) as { items?: ReprintItem[]; reason?: string };
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Yeniden basılacak kalem seçilmedi." }, { status: 400 });
  }

  const { data: original } = await guard.supabase
    .from("orders")
    .select('id, "userId", "addressId", "billingAddressId", "paymentMethod", source, type, "photosPurgedAt"')
    .eq("id", id)
    .single();

  if (!original) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  if (original.type === "reprint") {
    return NextResponse.json({ error: "Reprint'in reprint'i oluşturulamaz. Orijinal siparişten yeniden basın." }, { status: 400 });
  }
  if (original.photosPurgedAt) {
    return NextResponse.json({ error: "Fotoğraflar saklama süresi dolduğu için silinmiş; yeniden basılamaz." }, { status: 409 });
  }

  // Seçili kalemleri orijinalden doğrula
  const { data: origItems } = await guard.supabase
    .from("order_items")
    .select('id, "productId", "variantSelections", "unitPrice", "uploadedImages", quantity')
    .eq("orderId", id)
    .in("id", items.map((i) => i.orderItemId));

  const origMap = new Map((origItems ?? []).map((it) => [it.id, it]));
  const reprintItems = items
    .map((sel) => {
      const it = origMap.get(sel.orderItemId);
      if (!it) return null;
      // Adet orijinali aşamaz
      const quantity = Math.max(1, Math.min(Math.floor(Number(sel.quantity) || 1), it.quantity));
      return { it, quantity };
    })
    .filter((x): x is { it: NonNullable<ReturnType<typeof origMap.get>>; quantity: number } => x !== null);

  if (reprintItems.length === 0) {
    return NextResponse.json({ error: "Geçerli kalem bulunamadı." }, { status: 400 });
  }

  const { data: reprint, error: orderErr } = await guard.supabase
    .from("orders")
    .insert({
      userId: original.userId,
      addressId: original.addressId,
      billingAddressId: original.billingAddressId,
      paymentMethod: original.paymentMethod,
      subtotal: 0,
      shippingFee: 0,
      total: 0,
      status: "PENDING",
      paymentStatus: "paid",
      source: original.source,
      type: "reprint",
      parentOrderId: original.id,
      reprintReason: reason?.trim() || null,
    })
    .select("id")
    .single();

  if (orderErr || !reprint) {
    console.error("[reprint] order insert hatası:", orderErr);
    return NextResponse.json({ error: "Reprint oluşturulamadı." }, { status: 500 });
  }

  const { error: itemsErr } = await guard.supabase.from("order_items").insert(
    reprintItems.map(({ it, quantity }) => ({
      orderId: reprint.id,
      productId: it.productId,
      variantSelections: it.variantSelections,
      quantity,
      unitPrice: it.unitPrice, // orijinal fiyat korunur (maliyet analizi); order.total=0
      uploadedImages: it.uploadedImages, // aynı stabil storage path'leri
    }))
  );

  if (itemsErr) {
    console.error("[reprint] order_items insert hatası:", itemsErr);
    // Yarım kalan reprint order'ını geri al
    await guard.supabase.from("orders").delete().eq("id", reprint.id);
    return NextResponse.json({ error: "Reprint kalemleri kaydedilemedi." }, { status: 500 });
  }

  return NextResponse.json({ reprintOrderId: reprint.id });
}
