import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { recordSlugChange } from "@/lib/slugHistory";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin.supabase
    .from("categories")
    .select("id, name, slug, description, parentId, imageUrl, show_on_home, home_position, sort_order, is_active, metaTitle, metaDescription, hero_image, theme_color, cta_label, cta_href")
    .order("sort_order")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, slug, description, parentId, imageUrl, metaTitle, metaDescription } = await req.json();

  // Yeni kategori, kendi seviyesinin (aynı üst kategori) en sonuna eklenir.
  const lastQuery = admin.supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const { data: last } = await (parentId ? lastQuery.eq("parentId", parentId) : lastQuery.is("parentId", null)).maybeSingle();
  const nextOrder = (last?.sort_order ?? 0) + 1;

  const { data, error } = await admin.supabase
    .from("categories")
    .insert({ name, slug, description: description || null, parentId: parentId || null, imageUrl: imageUrl || null, metaTitle: metaTitle || null, metaDescription: metaDescription || null, sort_order: nextOrder })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Bu slug zaten kullanımda, farklı bir slug girin." }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("categories", "max");
  revalidateTag("products", "max");
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  // Partial güncelleme: yalnızca gönderilen alanları yaz (hızlı aktif/pasif toggle bütün
  // formu göndermeden çalışsın diye).
  const patch: Record<string, unknown> = {};
  if ("name" in body) patch.name = body.name;
  if ("slug" in body) patch.slug = body.slug;
  if ("description" in body) patch.description = body.description || null;
  if ("parentId" in body) patch.parentId = body.parentId || null;
  if ("imageUrl" in body) patch.imageUrl = body.imageUrl || null;
  if ("show_on_home" in body) patch.show_on_home = !!body.show_on_home;
  if ("home_position" in body) patch.home_position = Number.isFinite(Number(body.home_position)) ? Number(body.home_position) : 0;
  if ("is_active" in body) patch.is_active = !!body.is_active;
  if ("metaTitle" in body) patch.metaTitle = body.metaTitle || null;
  if ("metaDescription" in body) patch.metaDescription = body.metaDescription || null;

  const oldSlug = "slug" in body
    ? (await admin.supabase.from("categories").select("slug").eq("id", id).single()).data?.slug
    : null;

  const { error } = await admin.supabase.from("categories").update(patch).eq("id", id);

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Bu slug zaten kullanımda, farklı bir slug girin." }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (oldSlug && body.slug && oldSlug !== body.slug) {
    await recordSlugChange(admin.supabase, "category", id, oldSlug, body.slug);
  }

  // Aktif/pasif değişimi üst kategoriden alt kategorilere yayılır (üst dalı yönetir).
  if ("is_active" in patch) {
    const { error: cascadeErr } = await admin.supabase
      .from("categories")
      .update({ is_active: patch.is_active })
      .eq("parentId", id);
    if (cascadeErr) return NextResponse.json({ error: cascadeErr.message }, { status: 500 });
  }

  revalidateTag("categories", "max");
  revalidateTag("products", "max");
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
      .from("categories")
      .update({ sort_order: Number(it.sort_order) || 0 })
      .eq("id", it.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("categories", "max");
  revalidateTag("products", "max");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();

  const { error } = await admin.supabase.from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag("categories", "max");
  revalidateTag("products", "max");
  return NextResponse.json({ ok: true });
}
