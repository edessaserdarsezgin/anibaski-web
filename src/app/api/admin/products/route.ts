import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "ADMIN") return null;
  return { user, supabase: createAdminClient() };
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, description, basePrice, categorySlug, imageUrls, variants, requiresPhotoUpload, photoCount } = body;
  const TR: Record<string, string> = { ç:"c",ğ:"g",ı:"i",İ:"i",ö:"o",ş:"s",ü:"u",Ç:"c",Ğ:"g",Ö:"o",Ş:"s",Ü:"u" };
  const slug = (body.slug as string).split("").map(c => TR[c] ?? c).join("")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const { data: category } = await admin.supabase
    .from("categories").select("id").eq("slug", categorySlug).single();

  if (!category) return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 400 });

  const { data: product, error: productError } = await admin.supabase
    .from("products")
    .insert({ name, slug, description, basePrice, categoryId: category.id, images: imageUrls?.length ? imageUrls : [], requiresPhotoUpload: !!requiresPhotoUpload, photoCount: photoCount ?? 1 })
    .select().single();

  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });

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

  return NextResponse.json(product, { status: 201 });
}
