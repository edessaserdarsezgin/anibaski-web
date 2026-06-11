import { createAdminClient } from "@/lib/supabase/server";

/**
 * Üyenin daha önce tamamlanmış (ödenmiş veya kapıda) bir siparişi var mı?
 * İlk-sipariş kuponu (`first_order_only`) bunu kullanır: prior order varsa kupon reddedilir.
 * Kredi kartı PENDING (henüz ödenmemiş) sipariş sayılmaz → kart denemesi yarım kalan üye
 * hâlâ ilk-sipariş indirimini kullanabilir.
 */
export async function hasPriorOrder(userId: string): Promise<boolean> {
  const db = createAdminClient();
  const { count } = await db
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("userId", userId)
    .or("paymentStatus.eq.paid,paymentMethod.eq.cod");
  return (count ?? 0) > 0;
}
