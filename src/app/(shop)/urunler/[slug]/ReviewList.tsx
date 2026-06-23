import { createAdminClient } from "@/lib/supabase/server";
import ReviewForm from "./ReviewForm";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  verifiedPurchase: boolean;
  createdAt: string;
  profile: { fullName: string | null } | null;
};

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "text-xl" : "text-sm";
  return (
    <span className={`${cls} leading-none`} aria-label={`${rating} yıldız`}>
      <span className="text-amber-400">{"★".repeat(rating)}</span>
      <span className="text-border">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

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

  const [{ data: rawReviews }, ownReview] = await Promise.all([
    admin
      .from("product_reviews")
      .select(`id, rating, title, body, "verifiedPurchase", "createdAt", profile:profiles!product_reviews_userId_fkey("fullName")`)
      .eq("productId", productId)
      .eq("isApproved", true)
      .order("createdAt", { ascending: false }),
    userId
      ? admin
          .from("product_reviews")
          .select("id")
          .eq("productId", productId)
          .eq("userId", userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const reviews = (rawReviews ?? []) as unknown as Review[];
  const hasReview = !!ownReview.data;

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <section className="mt-12 pt-10 border-t border-border">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl text-text">Yorumlar</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Stars rating={Math.round(avgRating)} size="lg" />
              <span className="text-sm text-text-light">
                {avgRating.toFixed(1)} · {reviews.length} yorum
              </span>
            </div>
          )}
        </div>
        <ReviewForm slug={slug} isLoggedIn={!!userId} hasReview={hasReview} />
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-text-light bg-bg border border-border rounded-xl px-5 py-6 text-center">
          Henüz yorum yok — ilk yorumu siz yapın!
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((r) => {
            const name = r.profile?.fullName ?? "Anonim";
            const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
            const date = new Date(r.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
            return (
              <div key={r.id} className="bg-white border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text leading-tight">{name}</p>
                      <p className="text-xs text-text-light">{date}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Stars rating={r.rating} />
                    {r.verifiedPurchase && (
                      <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                        ✓ Satın Aldı
                      </span>
                    )}
                  </div>
                </div>
                {r.title && <p className="text-sm font-semibold text-text mb-1">{r.title}</p>}
                {r.body && <p className="text-sm text-text-light leading-relaxed">{r.body}</p>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
