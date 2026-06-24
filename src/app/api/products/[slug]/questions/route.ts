import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendQuestionNotification } from "@/lib/email/questionNotification";
import { notifyAdminNewQuestion, getAdminPhone } from "@/lib/whatsapp/notify";

type Props = { params: Promise<{ slug: string }> };

// GET — ürün sorularını çek (görünür + cevaplandı)
export async function GET(_req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: product } = await admin.from("products").select("id").eq("slug", slug).single();
  if (!product) return NextResponse.json([]);

  const { data } = await admin
    .from("product_questions")
    .select(`id, question, answer, "answeredAt", "createdAt",
      profile:profiles!product_questions_userId_fkey("fullName")`)
    .eq("productId", product.id)
    .eq("isVisible", true)
    .not("answer", "is", null)
    .order("createdAt", { ascending: false });

  return NextResponse.json(data ?? []);
}

// POST — soru gönder
export async function POST(req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });

  const { question } = await req.json() as { question: string };
  const q = question?.trim();
  if (!q || q.length < 5)
    return NextResponse.json({ error: "Soru en az 5 karakter olmalı." }, { status: 400 });

  const admin = createAdminClient();
  const { data: product } = await admin.from("products").select("id, name").eq("slug", slug).single();
  if (!product) return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });

  const { data: questionRow, error } = await admin
    .from("product_questions")
    .insert({ productId: product.id, userId: user.id, question: q })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "Soru gönderilemedi." }, { status: 500 });

  // Kullanıcı adını ve admin telefonunu paralel çek
  const [{ data: profile }, adminPhone] = await Promise.all([
    admin.from("profiles").select('"fullName"').eq("id", user.id).single(),
    getAdminPhone(),
  ]);

  sendQuestionNotification({
    productName: product.name,
    productSlug: slug,
    customerName: profile?.fullName ?? null,
    question: q,
  }).catch(() => {});

  if (adminPhone && questionRow) {
    const sent = await notifyAdminNewQuestion(adminPhone, {
      productName: product.name,
      productSlug: slug,
      customerName: profile?.fullName ?? null,
      question: q,
    });
    if (sent) {
      await admin.from("product_questions")
        .update({ waNotifiedAt: new Date().toISOString() })
        .eq("id", questionRow.id);
    }
  }

  return NextResponse.json({ ok: true });
}
