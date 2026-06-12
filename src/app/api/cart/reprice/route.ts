import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { activeDiscountPercent, applyDiscount } from "@/lib/pricing";
import { getActiveItemPromotions } from "@/lib/promotions";
import { bestItemDiscount } from "@/lib/promotionsCalc";

// Sepetteki kalemlerin GÜNCEL birim fiyatını döndürür (Katman A: ürün indirimi + kategori/tüm item promotion).
// orders/route.ts ile birebir aynı mantık — sepet eski fiyatı göstermesin diye. Fiyatlar public, auth gerekmez.
export async function POST(req: NextRequest) {
  const { items } = (await req.json()) as {
    items?: { productId: string; variantSelections?: Record<string, { id?: string }> }[];
  };
  const list = items ?? [];
  if (list.length === 0) return NextResponse.json({ prices: [] });

  const adminDb = createAdminClient();
  const productIds = [...new Set(list.map((i) => i.productId).filter(Boolean))];
  const variantIds = [...new Set(
    list.flatMap((i) => Object.values(i.variantSelections ?? {}).map((v) => v?.id).filter(Boolean) as string[])
  )];

  const [{ data: products }, { data: variants }] = await Promise.all([
    adminDb.from("products").select('id, basePrice, "categoryId", discount_percent, discount_starts_at, discount_ends_at, isActive').in("id", productIds),
    variantIds.length
      ? adminDb.from("product_variants").select("id, productId, priceAddon").in("id", variantIds)
      : Promise.resolve({ data: [] as { id: string; productId: string; priceAddon: number }[] }),
  ]);

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));
  const itemPromos = await getActiveItemPromotions();

  // Her kalem için güncel birim fiyat; ürün silinmiş/pasifse null (sepetten düşürülecek)
  const prices = list.map((item) => {
    const product = productMap.get(item.productId);
    if (!product || product.isActive === false) return null;

    let addons = 0;
    for (const sel of Object.values(item.variantSelections ?? {})) {
      const vid = sel?.id;
      if (!vid) continue;
      const v = variantMap.get(vid);
      if (v && v.productId === item.productId) addons += Number(v.priceAddon) || 0;
    }

    const fullUnit = Number(product.basePrice) + addons;
    const categoryId = (product as { categoryId?: string | null }).categoryId ?? null;
    const ownPrice = applyDiscount(fullUnit, activeDiscountPercent(product as Parameters<typeof activeDiscountPercent>[0]));
    const promoPrice = bestItemDiscount({ productId: item.productId, categoryId, unitPrice: fullUnit }, itemPromos).unitPrice;
    return Math.min(ownPrice, promoPrice);
  });

  return NextResponse.json({ prices });
}
