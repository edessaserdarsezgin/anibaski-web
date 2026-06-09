import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path } = await req.json() as { path: string };
  if (!path || !path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Geçersiz dosya yolu" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  const { data: fileData, error: downloadError } = await adminSupabase.storage
    .from("uploads")
    .download(path);

  if (downloadError || !fileData) {
    return NextResponse.json({ error: "Dosya indirilemedi" }, { status: 500 });
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());

  const optimized = await sharp(buffer)
    .rotate()                                  // EXIF yönüne göre düzelt
    .normalize()                               // Otomatik ton düzeltme (auto-levels)
    .modulate({ saturation: 1.12 })            // Baskıda soluk görünümü önle
    .sharpen({ sigma: 0.6, m1: 0, m2: 2 })    // Baskı keskinliği
    .jpeg({ quality: 95, mozjpeg: true })
    .toBuffer();

  const optimizedPath = path.replace(/\.[^/.]+$/, "-optimized.jpg");

  const { error: uploadError } = await adminSupabase.storage
    .from("uploads")
    .upload(optimizedPath, optimized, { contentType: "image/jpeg", upsert: true });

  if (uploadError) {
    console.error("[optimize-image] yükleme hatası:", uploadError);
    return NextResponse.json({ error: "Görsel işlenemedi" }, { status: 500 });
  }

  const { data: signed } = await adminSupabase.storage
    .from("uploads")
    .createSignedUrl(optimizedPath, 60 * 60 * 24 * 7);

  return NextResponse.json({ url: signed?.signedUrl, path: optimizedPath });
}
