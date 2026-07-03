import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { recordSlugChange } from "@/lib/slugHistory";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin.supabase
    .from("collections")
    .select("id, name, slug, description, hero_image, theme_color, cta_label, cta_href, metaTitle, metaDescription, is_active, show_on_home, sort_order")
    .order("sort_order")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, slug, description, hero_image, theme_color, cta_label, cta_href, metaTitle, metaDescription } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: "name ve slug gerekli" }, { status: 400 });

  const { data: last } = await admin.supabase
    .from("collections")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (last?.sort_order ?? 0) + 1;

  const { data, error } = await admin.supabase
    .from("collections")
    .insert({
      name, slug,
      description: description || null,
      hero_image: hero_image || null,
      theme_color: theme_color || null,
      cta_label: cta_label || null,
      cta_href: cta_href || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Bu slug zaten kullanımda, farklı bir slug girin." }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("collections", "max");
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  // Partial güncelleme: yalnızca gönderilen alanları yaz (hızlı toggle'lar bütün formu göndermesin).
  const patch: Record<string, unknown> = {};
  if ("name" in body) patch.name = body.name;
  if ("slug" in body) patch.slug = body.slug;
  if ("description" in body) patch.description = body.description || null;
  if ("hero_image" in body) patch.hero_image = body.hero_image || null;
  if ("theme_color" in body) patch.theme_color = body.theme_color || null;
  if ("cta_label" in body) patch.cta_label = body.cta_label || null;
  if ("cta_href" in body) patch.cta_href = body.cta_href || null;
  if ("metaTitle" in body) patch.metaTitle = body.metaTitle || null;
  if ("metaDescription" in body) patch.metaDescription = body.metaDescription || null;
  if ("is_active" in body) patch.is_active = !!body.is_active;
  if ("show_on_home" in body) patch.show_on_home = !!body.show_on_home;
  patch.updated_at = new Date().toISOString();

  const oldSlug = "slug" in body
    ? (await admin.supabase.from("collections").select("slug").eq("id", id).single()).data?.slug
    : null;

  const { error } = await admin.supabase.from("collections").update(patch).eq("id", id);

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Bu slug zaten kullanımda, farklı bir slug girin." }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (oldSlug && body.slug && oldSlug !== body.slug) {
    await recordSlugChange(admin.supabase, "collection", id, oldSlug, body.slug);
  }

  revalidateTag("collections", "max");
  return NextResponse.json({ ok: true });
}

// Bulk sıralama — sürükle-bırak sonrası [{id, sort_order}] listesi.
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { items } = await req.json();
  if (!Array.isArray(items)) return NextResponse.json({ error: "items gerekli" }, { status: 400 });

  for (const it of items) {
    if (!it?.id) continue;
    const { error } = await admin.supabase
      .from("collections")
      .update({ sort_order: Number(it.sort_order) || 0 })
      .eq("id", it.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("collections", "max");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();

  const { error } = await admin.supabase.from("collections").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag("collections", "max");
  return NextResponse.json({ ok: true });
}
