import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { isRateLimited } from "@/lib/rateLimit";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { user, supabase: adminClient } = guard;

  if (isRateLimited(`admin-upload:${user.id}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Çok fazla istek. Lütfen 1 dakika bekleyin." },
      { status: 429 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Geçersiz dosya tipi. Yalnızca JPG, PNG veya WEBP kabul edilir." }, { status: 400 });
  }

  const MAX_SIZE_BYTES = 20 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Dosya boyutu 20 MB sınırını aşıyor." }, { status: 400 });
  }

  // Katalog görselleri yalnız ekranda gösterilir (basılmaz) → agresif optimize:
  // EXIF yönü + en uzun kenar 1600px (büyütmeden) + WebP q80. ~2 MB ham → ~150-300 KB.
  const inputBuf = Buffer.from(await file.arrayBuffer());
  const optimized = await sharp(inputBuf)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const path = `${Date.now()}.webp`;
  const { error } = await adminClient.storage.from("products").upload(path, optimized, {
    contentType: "image/webp",
    upsert: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = adminClient.storage.from("products").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
