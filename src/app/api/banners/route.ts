import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const revalidate = 60; // her 60 saniyede bir yenile

export async function GET() {
  const adminDb = createAdminClient();
  const now = new Date().toISOString();

  const { data } = await adminDb
    .from("banners")
    .select("id, text, url, bgColor")
    .eq("isActive", true)
    .or(`startAt.is.null,startAt.lte.${now}`)
    .or(`endAt.is.null,endAt.gte.${now}`)
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json(data ?? null);
}
