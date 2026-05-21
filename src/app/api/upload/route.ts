import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("uploads")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { signedUrl } } = await supabase.storage
    .from("uploads")
    .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 gün geçerli

  return NextResponse.json({ url: signedUrl, path });
}
