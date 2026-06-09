import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Favori ekle
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId gerekli" }, { status: 400 });

  const db = createAdminClient();
  const { error } = await db.from("favorites").upsert(
    { userId: user.id, productId },
    { onConflict: "userId,productId", ignoreDuplicates: true }
  );

  if (error) {
    console.error("[favorites] hata:", error);
    return NextResponse.json({ error: "Favori işlemi başarısız" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// Favori kaldır
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId gerekli" }, { status: 400 });

  const db = createAdminClient();
  const { error } = await db.from("favorites")
    .delete()
    .eq("userId", user.id)
    .eq("productId", productId);

  if (error) {
    console.error("[favorites] hata:", error);
    return NextResponse.json({ error: "Favori işlemi başarısız" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
