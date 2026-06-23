import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signUploadedImages } from "@/lib/uploads";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ urls: [] });

  const { paths } = await req.json() as { paths: string[] };
  if (!Array.isArray(paths) || paths.length === 0) return NextResponse.json({ urls: [] });

  const urls = await signUploadedImages(paths, 60 * 60).catch(() => paths);
  return NextResponse.json({ urls });
}
