import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const body = await req.json();
  if (!body.title || !body.slug || !body.image_url || !body.cta_url) {
    return NextResponse.json({ error: "title, slug, image_url ve cta_url zorunlu." }, { status: 400 });
  }

  const { data, error } = await createAdminClient()
    .from("campaigns")
    .insert({
      title: body.title,
      slug: body.slug,
      subtitle: body.subtitle ?? null,
      description: body.description ?? null,
      image_url: body.image_url,
      cta_text: body.cta_text || "İncele",
      cta_url: body.cta_url,
      coupon_code: body.coupon_code ?? null,
      starts_at: body.starts_at ?? null,
      ends_at: body.ends_at ?? null,
      position: body.position ?? 0,
      is_active: body.is_active ?? true,
      show_on_home: body.show_on_home ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
