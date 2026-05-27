import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { imageUrls?: unknown; photoCount?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  const { imageUrls, photoCount } = body;

  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return NextResponse.json({ error: "imageUrls gerekli" }, { status: 400 });
  }

  const webhookUrl = process.env.N8N_AI_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ error: "AI servisi yapılandırılmamış" }, { status: 503 });
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrls, photoCount: photoCount ?? imageUrls.length }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "AI analiz başarısız" }, { status: 502 });
  }

  const raw = await response.json();
  if (typeof raw?.recommendedProduct !== "string") {
    return NextResponse.json({ error: "Geçersiz AI yanıtı" }, { status: 502 });
  }
  return NextResponse.json(raw);
}
