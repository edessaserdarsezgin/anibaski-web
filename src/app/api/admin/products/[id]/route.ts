import { NextRequest, NextResponse } from "next/server";
import { parseDiscountInput } from "@/lib/pricing";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const { data, error } = await admin.supabase
    .from("products")
    .select("*, category:categories!products_categoryId_fkey(id, name, slug)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, slug, basePrice, categoryId, description, images, specs, isActive, requiresPhotoUpload, photoCount, mockupTemplateUrl } = body;

  const updateData: Record<string, unknown> = { name, slug, basePrice, categoryId, description: description || null, images, specs: specs || null, ...parseDiscountInput(body), is_featured: !!body.is_featured, featured_position: Number.isFinite(Number(body.featured_position)) ? Number(body.featured_position) : 0 };
  if (typeof isActive === "boolean") updateData.isActive = isActive;
  if (typeof requiresPhotoUpload === "boolean") {
    updateData.requiresPhotoUpload = requiresPhotoUpload;
    updateData.photoCount = photoCount ?? 1;
  }
  if (mockupTemplateUrl !== undefined) updateData.mockupTemplateUrl = mockupTemplateUrl || null;

  const { error } = await admin.supabase
    .from("products")
    .update(updateData)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  revalidateTag("products", "max");
  return NextResponse.json({ ok: true });
}
