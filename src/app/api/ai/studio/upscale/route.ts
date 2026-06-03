import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { callAuraSpace } from "@/lib/aiUpscale";
import { hasCredit, recordSuccess, recordError } from "@/lib/studioCredits";

export const maxDuration = 60; // AuraSR ~17-34sn; Vercel Pro gerekir (Hobby 10s'de keser)

const MAX_EDGE = 2000; // büyük girdiyi indir: çıktı maks ~8000px, hız/bellek guard'ı

export async function POST(req: NextRequest) {
  // 1. Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  // 2. Kredi kontrolü (günlük ücretsiz + kazanılmış)
  if (!(await hasCredit(user.id))) {
    return NextResponse.json({ error: "Kredin doldu", code: "quota" }, { status: 429 });
  }

  // 3. Dosya
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  }
  const inputBuf = Buffer.from(await file.arrayBuffer());

  // 4. EXIF yönünü uygula (.rotate) + büyük girdiyi 2000px'e indir.
  //    .rotate() olmadan dönmüş fotoğraf sonuçta yan/ters çıkıyordu.
  const meta = await sharp(inputBuf).metadata();
  const maxEdge = Math.max(meta.width ?? 0, meta.height ?? 0);
  let pipeline = sharp(inputBuf).rotate();
  if (maxEdge > MAX_EDGE) pipeline = pipeline.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside" });
  const normalized = await pipeline.toBuffer();

  // 5. Upscale + kredi/job kaydı
  try {
    const out = await callAuraSpace(normalized);
    await recordSuccess(user.id, "upscale");
    return new NextResponse(new Uint8Array(out), {
      status: 200,
      headers: { "Content-Type": "image/webp" },
    });
  } catch {
    await recordError(user.id, "upscale");
    return NextResponse.json({ error: "Upscale başarısız, tekrar dene" }, { status: 502 });
  }
}
