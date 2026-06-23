import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminPhone, notifyAdminNewReview, notifyAdminNewQuestion } from "@/lib/whatsapp/notify";

const MAX_RETRY = 3;
const DELAY_MINUTES = 10;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - DELAY_MINUTES * 60 * 1000).toISOString();
  const adminPhone = await getAdminPhone();

  if (!adminPhone) {
    return NextResponse.json({ ok: true, skipped: "admin telefon bulunamadı" });
  }

  let reviewsSent = 0, questionsSent = 0;

  // Bildirim gönderilmemiş yorumlar
  const { data: reviews } = await admin
    .from("product_reviews")
    .select(`id, rating, title, body, "waRetryCount",
      product:products!product_reviews_productId_fkey(name, slug),
      profile:profiles!product_reviews_userId_fkey("fullName")`)
    .is("waNotifiedAt", null)
    .lt("createdAt", cutoff)
    .lt("waRetryCount", MAX_RETRY);

  for (const r of reviews ?? []) {
    const prod = (r.product as unknown) as { name: string; slug: string } | null;
    const prof = (r.profile as unknown) as { fullName: string | null } | null;
    const sent = await notifyAdminNewReview(adminPhone, {
      productName: prod?.name ?? "—",
      productSlug: prod?.slug ?? "",
      customerName: prof?.fullName ?? null,
      rating: r.rating,
      title: r.title,
      body: r.body,
    });
    if (sent) {
      await admin.from("product_reviews")
        .update({ waNotifiedAt: new Date().toISOString() })
        .eq("id", r.id);
      reviewsSent++;
    } else {
      await admin.from("product_reviews")
        .update({ waRetryCount: (r.waRetryCount ?? 0) + 1 })
        .eq("id", r.id);
    }
  }

  // Bildirim gönderilmemiş sorular
  const { data: questions } = await admin
    .from("product_questions")
    .select(`id, question, "waRetryCount",
      product:products!product_questions_productId_fkey(name, slug),
      profile:profiles!product_questions_userId_fkey("fullName")`)
    .is("waNotifiedAt", null)
    .lt("createdAt", cutoff)
    .lt("waRetryCount", MAX_RETRY);

  for (const q of questions ?? []) {
    const prod = (q.product as unknown) as { name: string; slug: string } | null;
    const prof = (q.profile as unknown) as { fullName: string | null } | null;
    const sent = await notifyAdminNewQuestion(adminPhone, {
      productName: prod?.name ?? "—",
      productSlug: prod?.slug ?? "",
      customerName: prof?.fullName ?? null,
      question: q.question,
    });
    if (sent) {
      await admin.from("product_questions")
        .update({ waNotifiedAt: new Date().toISOString() })
        .eq("id", q.id);
      questionsSent++;
    } else {
      await admin.from("product_questions")
        .update({ waRetryCount: (q.waRetryCount ?? 0) + 1 })
        .eq("id", q.id);
    }
  }

  return NextResponse.json({
    ok: true,
    reviewsSent,
    questionsSent,
    reviewsChecked: reviews?.length ?? 0,
    questionsChecked: questions?.length ?? 0,
  });
}
