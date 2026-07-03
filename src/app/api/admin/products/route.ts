import { NextRequest, NextResponse } from "next/server";
import { parseDiscountInput } from "@/lib/pricing";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { slugify } from "@/lib/slug";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin.supabase
    .from("products")
    .select("id, name, slug")
    .eq("isActive", true)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, description, basePrice, categorySlug, imageUrls, variants, requiresPhotoUpload, photoCount, specs, metaTitle, metaDescription } = body;
  const slug = slugify(body.slug as string);

  const { data: category } = await admin.supabase
    .from("categories").select("id").eq("slug", categorySlug).single();

  if (!category) return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 400 });

  const { data: product, error: productError } = await admin.supabase
    .from("products")
    .insert({ name, slug, description, basePrice, categoryId: category.id, images: imageUrls?.length ? imageUrls : [], requiresPhotoUpload: !!requiresPhotoUpload, photoCount: photoCount ?? 1, specs: specs ?? null, metaTitle: metaTitle || null, metaDescription: metaDescription || null, ...parseDiscountInput(body), is_featured: !!body.is_featured, featured_position: Number.isFinite(Number(body.featured_position)) ? Number(body.featured_position) : 0 })
    .select().single();

  if (productError) {
    if (productError.code === "23505") return NextResponse.json({ error: "Bu slug zaten kullanımda, farklı bir slug girin." }, { status: 409 });
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  if (variants?.length) {
    const { error: variantError } = await admin.supabase.from("product_variants").insert(
      variants.map((v: { type: string; label: string; value: string; priceAddon: number }) => ({
        productId: product.id,
        type: v.type,
        label: v.label,
        value: v.value,
        priceAddon: v.priceAddon ?? 0,
      }))
    );
    if (variantError) return NextResponse.json({ error: "Ürün eklendi ama varyantlar kaydedilemedi: " + variantError.message }, { status: 500 });
  }

  revalidateTag("products", "max");
  return NextResponse.json(product, { status: 201 });
}
