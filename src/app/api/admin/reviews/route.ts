import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  const { data } = await guard.supabase
    .from("product_reviews")
    .select(`id, rating, title, body, "isApproved", "verifiedPurchase", "createdAt",
      product:products!product_reviews_productId_fkey(name, slug),
      profile:profiles!product_reviews_userId_fkey("fullName", email)`)
    .order("createdAt", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { productId, rating, title, body } = await req.json() as {
    productId: string;
    rating: number;
    title?: string;
    body?: string;
  };

  if (!productId || !rating || rating < 1 || rating > 5)
    return NextResponse.json({ error: "Geçersiz veri." }, { status: 400 });

  const { error } = await guard.supabase
    .from("product_reviews")
    .upsert(
      {
        productId,
        userId: guard.user.id,
        rating,
        title: title?.trim() || null,
        body: body?.trim() || null,
        verifiedPurchase: false,
        isApproved: true,
      },
      { onConflict: "productId,userId" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
