import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getReadyMadeCategoryIds } from "@/lib/readyMade";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { imageUrls?: string[]; photoCount?: number; occasion?: string; budget?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  const { imageUrls, photoCount, occasion = "", budget = "", notes = "" } = body;

  const resolvedPhotoCount =
    typeof photoCount === "number"
      ? photoCount
      : Array.isArray(imageUrls)
      ? imageUrls.length
      : 1;

  const webhookUrl = process.env.N8N_AI_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ error: "AI servisi yapılandırılmamış" }, { status: 503 });
  }

  const adminDb = createAdminClient();

  const readyMadeIds = await getReadyMadeCategoryIds();
  let productsQuery = adminDb
    .from("products")
    .select("name")
    .eq("isActive", true);
  if (readyMadeIds.length > 0) {
    productsQuery = productsQuery.not("categoryId", "in", `(${readyMadeIds.join(",")})`);
  }
  const { data: activeProducts } = await productsQuery;

  const productList = (activeProducts ?? []).map((p: { name: string }) => p.name);

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      photoCount: resolvedPhotoCount,
      occasion,
      budget,
      notes,
      productList,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "AI analiz başarısız" }, { status: 502 });
  }

  let raw: Record<string, unknown>;
  try {
    raw = await response.json();
  } catch {
    const text = await response.text().catch(() => "(okunamadı)");
    console.error("[AI] n8n webhook geçersiz JSON döndü:", text);
    return NextResponse.json({ error: "AI servisi geçersiz yanıt döndü" }, { status: 502 });
  }

  if (typeof raw?.recommendedProduct !== "string") {
    console.error("[AI] n8n yanıtında recommendedProduct yok:", JSON.stringify(raw));
    return NextResponse.json({ error: "Geçersiz AI yanıtı" }, { status: 502 });
  }

  const { data: recommended } = await adminDb
    .from("products")
    .select("slug, images")
    .ilike("name", `%${raw.recommendedProduct}%`)
    .limit(1)
    .maybeSingle();

  let alternativeSlug: string | null = null;
  if (typeof raw.alternativeProduct === "string" && raw.alternativeProduct) {
    const { data: alt } = await adminDb
      .from("products")
      .select("slug")
      .ilike("name", `%${raw.alternativeProduct}%`)
      .limit(1)
      .maybeSingle();
    alternativeSlug = alt?.slug ?? null;
  }

  return NextResponse.json({
    ...raw,
    recommendedProductSlug: recommended?.slug ?? null,
    recommendedProductImage: (recommended?.images as string[] | null)?.[0] ?? null,
    alternativeProductSlug: alternativeSlug,
  });
}
