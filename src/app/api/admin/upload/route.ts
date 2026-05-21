import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adminClient = createAdminClient();

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

  const ALLOWED_EXTENSIONS: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const ext = ALLOWED_EXTENSIONS[file.type];
  const path = `${Date.now()}.${ext}`;

  const { error } = await adminClient.storage.from("products").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = adminClient.storage.from("products").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
