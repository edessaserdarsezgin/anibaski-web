import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type SnapshotItem = {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  variantSelections?: Record<string, unknown>;
};

/**
 * Kullanıcı sepetinin server snapshot'ını günceller.
 * Boş sepet gönderirse snapshot silinir.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 200 });

  const { items } = await req.json() as { items: SnapshotItem[] };

  const adminClient = createAdminClient();

  if (!items || items.length === 0) {
    await adminClient.from("abandoned_cart_snapshots").delete().eq("user_id", user.id);
    return NextResponse.json({ ok: true, cleared: true });
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  await adminClient.from("abandoned_cart_snapshots").upsert({
    user_id: user.id,
    items,
    subtotal,
    item_count: itemCount,
    updated_at: new Date().toISOString(),
    first_reminder_sent_at: null,
    second_reminder_sent_at: null,
  }, { onConflict: "user_id" });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 200 });

  await createAdminClient().from("abandoned_cart_snapshots").delete().eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
