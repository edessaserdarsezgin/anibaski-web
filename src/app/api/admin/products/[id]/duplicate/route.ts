import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: original, error: fetchError } = await supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .eq("id", id)
    .single();

  if (fetchError || !original) return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });

  // Slug çakışmalarını önle
  const baseSlug = `${original.slug}-kopya`;
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data: existing } = await supabase.from("products").select("id").eq("slug", slug).single();
    if (!existing) break;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const { data: copy, error: insertError } = await supabase
    .from("products")
    .insert({
      name: `Kopya — ${original.name}`,
      slug,
      description: original.description,
      basePrice: original.basePrice,
      categoryId: original.categoryId,
      images: original.images ?? [],
      requiresPhotoUpload: original.requiresPhotoUpload,
      photoCount: original.photoCount,
      specs: original.specs,
      mockupTemplateUrl: original.mockupTemplateUrl,
      isActive: false,
    })
    .select()
    .single();

  if (insertError || !copy) return NextResponse.json({ error: insertError?.message }, { status: 500 });

  if (original.variants?.length) {
    await supabase.from("product_variants").insert(
      original.variants.map((v: { type: string; label: string; value: string; priceAddon: number }) => ({
        productId: copy.id,
        type: v.type,
        label: v.label,
        value: v.value,
        priceAddon: v.priceAddon,
      }))
    );
  }

  revalidateTag("products", "max");
  return NextResponse.json({ id: copy.id });
}
