import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { callQwenEdit, EDIT_PRESETS } from "@/lib/aiEdit";

export const maxDuration = 60; // Qwen-Image-Edit üretimi; Vercel'de Pro gerekir

const DAILY_LIMIT = 5;   // AuraSR upscale ile ORTAK havuz (tool filtresi yok)
const MAX_EDGE = 2000;   // büyük girdiyi indir: hız/bellek guard'ı

export async function POST(req: NextRequest) {
  // 1. Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const adminDb = createAdminClient();

  // 2. Ortak günlük kota: bugünün tüm başarılı studio işleri (upscale + edit birlikte)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count } = await adminDb
    .from("studio_jobs")
    .select("id", { count: "exact", head: true })
    .eq("userId", user.id)
    .eq("status", "success")
    .gte("createdAt", startOfDay.toISOString());
  if ((count ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json({ error: "Günlük 5 ücretsiz hakkın doldu", code: "quota" }, { status: 429 });
  }

  // 3. Dosya + efekt
  const form = await req.formData();
  const file = form.get("file");
  const preset = form.get("preset");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  }
  if (typeof preset !== "string" || !(preset in EDIT_PRESETS)) {
    return NextResponse.json({ error: "Geçersiz efekt" }, { status: 400 });
  }
  const inputBuf = Buffer.from(await file.arrayBuffer());

  // 4. Büyük girdiyi 2000px'e indir
  const meta = await sharp(inputBuf).metadata();
  const maxEdge = Math.max(meta.width ?? 0, meta.height ?? 0);
  const normalized = maxEdge > MAX_EDGE
    ? await sharp(inputBuf).resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside" }).toBuffer()
    : inputBuf;

  // 5. Düzenle + job kaydı
  try {
    const out = await callQwenEdit(normalized, preset);
    await adminDb.from("studio_jobs").insert({ userId: user.id, tool: preset, status: "success" });
    return new NextResponse(new Uint8Array(out), {
      status: 200,
      headers: { "Content-Type": "image/webp" },
    });
  } catch {
    await adminDb.from("studio_jobs").insert({ userId: user.id, tool: preset, status: "error" });
    return NextResponse.json({ error: "İşlem başarısız, tekrar dene" }, { status: 502 });
  }
}
