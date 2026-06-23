import { createAdminClient } from "@/lib/supabase/server";
import ReviewForm from "./ReviewForm";
import ReviewGrid, { type ReviewItem } from "./ReviewGrid";

export default async function ReviewList({
  productId,
  slug,
  userId,
}: {
  productId: string;
  slug: string;
  userId: string | null;
}) {
  const admin = createAdminClient();

  const [{ data: rawReviews }, ownReview, purchaseCheck] = await Promise.all([
    admin
      .from("product_reviews")
      .select(`id, rating, title, body, "verifiedPurchase", "createdAt", profile:profiles!product_reviews_userId_fkey("fullName")`)
      .eq("productId", productId)
      .eq("isApproved", true)
      .order("createdAt", { ascending: false }),
    userId
      ? admin.from("product_reviews").select("id").eq("productId", productId).eq("userId", userId).maybeSingle()
      : Promise.resolve({ data: null }),
    // Satın alma kontrolü: teslim edilmiş sipariş var mı?
    userId
      ? admin
          .from("order_items")
          .select("id, order:orders!inner(userId, status)")
          .eq("productId", productId)
          .eq("order.userId", userId)
          .eq("order.status", "DELIVERED")
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const reviews = (rawReviews ?? []) as unknown as ReviewItem[];
  const hasReview = !!ownReview.data;
  const hasPurchased = !!purchaseCheck.data;

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <section className="mt-12 pt-10 border-t border-border">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <h2 className="font-serif text-2xl text-text">Yorumlar</h2>
        <ReviewForm
          slug={slug}
          isLoggedIn={!!userId}
          hasReview={hasReview}
          hasPurchased={hasPurchased}
        />
      </div>

      <ReviewGrid reviews={reviews} avgRating={avgRating} />
    </section>
  );
}
