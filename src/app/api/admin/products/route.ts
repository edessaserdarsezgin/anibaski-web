import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile || profile.role !== "ADMIN") return null;
  return user;
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, slug, description, basePrice, categorySlug } = await req.json();

  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 400 });

  const product = await prisma.product.create({
    data: { name, slug, description, basePrice, categoryId: category.id, images: [] },
  });

  return NextResponse.json(product, { status: 201 });
}
