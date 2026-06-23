import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

// GET — ürün yorumlarını çek (onaylı)
export async function GET(_req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: product } = await admin
    .from("products")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!product) return NextResponse.json({ reviews: [], avgRating: 0, count: 0 });

  const { data: reviews } = await admin
    .from("product_reviews")
    .select(`id, rating, title, body, "verifiedPurchase", "createdAt", profile:profiles!product_reviews_userId_fkey("fullName")`)
    .eq("productId", product.id)
    .eq("isApproved", true)
    .order("createdAt", { ascending: false });

  const list = reviews ?? [];
  const avgRating = list.length
    ? Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10
    : 0;

  return NextResponse.json({ reviews: list, avgRating, count: list.length });
}

// POST — yorum gönder
export async function POST(req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });

  const { rating, title, body } = await req.json() as { rating: number; title?: string; body?: string };
  if (!rating || rating < 1 || rating > 5)
    return NextResponse.json({ error: "Geçersiz puan." }, { status: 400 });

  const admin = createAdminClient();

  const { data: product } = await admin
    .from("products")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!product) return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });

  // Tamamlanmış sipariş kontrolü (verifiedPurchase)
  const { data: orderItem } = await admin
    .from("order_items")
    .select("id, order:orders!inner(userId, status)")
    .eq("productId", product.id)
    .eq("order.userId", user.id)
    .eq("order.status", "DELIVERED")
    .maybeSingle();

  if (!orderItem)
    return NextResponse.json(
      { error: "Yorum yapabilmek için bu ürünü satın almış ve teslim almış olmanız gerekiyor." },
      { status: 403 }
    );

  const { error } = await admin
    .from("product_reviews")
    .upsert(
      {
        productId: product.id,
        userId: user.id,
        rating,
        title: title?.trim() || null,
        body: body?.trim() || null,
        verifiedPurchase: true,
        isApproved: true,
      },
      { onConflict: "productId,userId" }
    );

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "Bu ürün için zaten bir yorum yaptınız." }, { status: 409 });
    return NextResponse.json({ error: "Yorum kaydedilemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
