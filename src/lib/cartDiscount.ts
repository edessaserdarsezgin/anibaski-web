import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { CartTier } from "@/lib/cartDiscountCalc";

// Sunucu tarafı: aktif sepet indirimi kademelerini (cache'li) sağlar.
// Saf hesaplama fonksiyonları için → @/lib/cartDiscountCalc (client-safe).
export { bestCartDiscount, tierDiscount, nextTier } from "@/lib/cartDiscountCalc";
export type { CartTier } from "@/lib/cartDiscountCalc";

/**
 * Aktif kademeler, min_subtotal artan sırada. Ana aç/kapa (cart_discount_config)
 * KAPALIYSA boş döner → otomatik indirim hiç uygulanmaz. Cache tag: "cart-discount".
 */
export const getCartDiscountTiers = unstable_cache(
  async (): Promise<CartTier[]> => {
    try {
      const db = createAdminClient();
      const { data: config } = await db
        .from("cart_discount_config").select("enabled").eq("id", 1).single();
      if (config && config.enabled === false) return [];

      const { data } = await db
        .from("cart_discount_tiers")
        .select("id, min_subtotal, discount_type, discount_value, is_active")
        .eq("is_active", true)
        .order("min_subtotal", { ascending: true });
      return (data ?? []).map((t) => ({
        id: t.id,
        minSubtotal: Number(t.min_subtotal),
        discountType: t.discount_type === "fixed" ? "fixed" : "percentage",
        discountValue: Number(t.discount_value),
        isActive: t.is_active,
      }));
    } catch {
      return [];
    }
  },
  ["cart-discount-tiers"],
  { tags: ["cart-discount"] }
);
