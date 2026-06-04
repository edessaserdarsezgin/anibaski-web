import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { parseDiscountInput } from "@/lib/pricing";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "ADMIN") return null;
  return { supabase: createAdminClient() };
}

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
  return NextResponse.json({ ok: true });
}
