import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag } from "next/cache";

const TRIGGERS = ["auto", "code"];
const LEVELS = ["item", "cart"];
const SCOPES = ["all", "products", "categories"];
const VALUE_TYPES = ["percentage", "fixed"];

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: rows } = await admin.supabase.from("promotions").select("*").order("created_at", { ascending: false });
  const ids = (rows ?? []).map((r) => r.id);
  const prodMap = new Map<string, string[]>();
  const catMap = new Map<string, string[]>();
  if (ids.length) {
    const [{ data: pp }, { data: pc }] = await Promise.all([
      admin.supabase.from("promotion_products").select("promotion_id, product_id").in("promotion_id", ids),
      admin.supabase.from("promotion_categories").select("promotion_id, category_id").in("promotion_id", ids),
    ]);
    for (const x of pp ?? []) { const a = prodMap.get(x.promotion_id) ?? []; a.push(x.product_id); prodMap.set(x.promotion_id, a); }
    for (const x of pc ?? []) { const a = catMap.get(x.promotion_id) ?? []; a.push(x.category_id); catMap.set(x.promotion_id, a); }
  }
  const out = (rows ?? []).map((r) => ({ ...r, productIds: prodMap.get(r.id) ?? [], categoryIds: catMap.get(r.id) ?? [] }));
  return NextResponse.json(out);
}

// Çakışma modu (stacking) ayarını güncelle
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { stacking } = await req.json();
  const { error } = await admin.supabase.from("discount_settings").upsert({ id: 1, stacking: !!stacking });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag("promotions", "max");
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const b = await req.json();
  const trigger = b.trigger, applyLevel = b.applyLevel, scope = b.scope ?? "all", valueType = b.valueType ?? "percentage";
  if (!b.name?.trim()) return NextResponse.json({ error: "İsim zorunlu." }, { status: 400 });
  if (!TRIGGERS.includes(trigger) || !LEVELS.includes(applyLevel) || !SCOPES.includes(scope) || !VALUE_TYPES.includes(valueType))
    return NextResponse.json({ error: "Geçersiz tür/kapsam." }, { status: 400 });
  const value = Number(b.value);
  if (!(value > 0)) return NextResponse.json({ error: "İndirim değeri 0'dan büyük olmalı." }, { status: 400 });
  if (valueType === "percentage" && value >= 100) return NextResponse.json({ error: "Yüzde indirim en fazla %99." }, { status: 400 });
  if (trigger === "code" && !b.code?.trim()) return NextResponse.json({ error: "Kupon için kod zorunlu." }, { status: 400 });

  const { data: created, error } = await admin.supabase.from("promotions").insert({
    name: b.name.trim(), trigger, apply_level: applyLevel, deal_type: "flat",
    code: trigger === "code" ? b.code.trim().toUpperCase() : null,
    scope, value_type: valueType, value,
    min_subtotal: b.minSubtotal ? Number(b.minSubtotal) : null,
    starts_at: b.startsAt || null, ends_at: b.endsAt || null,
    max_uses: b.maxUses ? Number(b.maxUses) : null,
    first_order_only: !!b.firstOrderOnly, priority: Number(b.priority) || 0,
  }).select("id").single();

  if (error || !created) return NextResponse.json({ error: error?.message ?? "Oluşturulamadı." }, { status: 500 });

  if (scope === "products" && Array.isArray(b.productIds) && b.productIds.length) {
    await admin.supabase.from("promotion_products").insert(b.productIds.map((pid: string) => ({ promotion_id: created.id, product_id: pid })));
  }
  if (scope === "categories" && Array.isArray(b.categoryIds) && b.categoryIds.length) {
    await admin.supabase.from("promotion_categories").insert(b.categoryIds.map((cid: string) => ({ promotion_id: created.id, category_id: cid })));
  }

  revalidateTag("promotions", "max");
  revalidateTag("products", "max");
  return NextResponse.json({ ok: true, id: created.id });
}
