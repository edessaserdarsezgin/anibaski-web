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

// Siparişe ait tüm fotoğraf URL'lerini JSON olarak döner
// Admin bu URL'leri kullanarak fotoğrafları indirebilir
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const { data: items, error } = await admin.supabase
    .from("order_items")
    .select("id, uploadedImages, product:products(name)")
    .eq("orderId", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (items ?? [])
    .filter(item => item.uploadedImages?.length > 0)
    .map(item => ({
      productName: (item.product as unknown as { name: string } | null)?.name ?? "Ürün",
      photos: item.uploadedImages as string[],
    }));

  return NextResponse.json({ orderId: id, items: result });
}
