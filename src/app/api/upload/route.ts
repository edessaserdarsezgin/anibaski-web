import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadToR2, signR2Images, R2_BUCKET } from "@/lib/r2";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Foto kitap gibi çok fotoğraflı siparişleri bozmayacak kadar cömert; scriptli kötüye kullanımı durdurur.
  if (isRateLimited(`upload:${user.id}`, 100, 60_000)) {
    return NextResponse.json({ error: "Çok fazla yükleme. Lütfen 1 dakika bekleyin." }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Geçersiz dosya tipi. Yalnızca JPG, PNG, WEBP veya HEIC kabul edilir." }, { status: 400 });
  }

  const MAX_SIZE_BYTES = 20 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Dosya boyutu 20 MB sınırını aşıyor." }, { status: 400 });
  }

  const ALLOWED_EXTENSIONS: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  const ext = ALLOWED_EXTENSIONS[file.type];
  const key = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, file.type);
  } catch (err) {
    console.error("[upload] R2 yükleme hatası:", err);
    return NextResponse.json({ error: "Yükleme başarısız" }, { status: 500 });
  }

  const [url] = await signR2Images([key], 60 * 60 * 24 * 7);
  return NextResponse.json({ url, path: key });
}

export const runtime = "nodejs";
// R2_BUCKET referansı tree-shaking'i engeller
void R2_BUCKET;
