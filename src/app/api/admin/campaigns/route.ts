import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const, status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return { error: "Forbidden" as const, status: 403 };
  return { ok: true as const };
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

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
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
