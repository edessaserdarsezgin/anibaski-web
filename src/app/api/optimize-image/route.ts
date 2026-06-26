import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { downloadFromR2, uploadToR2, signR2Images } from "@/lib/r2";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path } = await req.json() as { path: string };
  if (!path || !path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Geçersiz dosya yolu" }, { status: 400 });
  }

  const original = await downloadFromR2(path);
  if (!original) return NextResponse.json({ error: "Dosya indirilemedi" }, { status: 500 });

  const optimized = await sharp(original)
    .rotate()                                  // EXIF yönüne göre düzelt
    .normalize()                               // Otomatik ton düzeltme (auto-levels)
    .modulate({ saturation: 1.12 })            // Baskıda soluk görünümü önle
    .sharpen({ sigma: 0.6, m1: 0, m2: 2 })    // Baskı keskinliği
    .jpeg({ quality: 95, mozjpeg: true })
    .toBuffer();

  const optimizedPath = path.replace(/\.[^/.]+$/, "-optimized.jpg");
  await uploadToR2(optimizedPath, optimized, "image/jpeg");

  const [url] = await signR2Images([optimizedPath], 60 * 60 * 24 * 7);
  return NextResponse.json({ url, path: optimizedPath });
}
