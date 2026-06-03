// AI Stüdyo kredi mantığı — tek kaynak. İki kova: günlük ücretsiz (devretmez) +
// kazanılmış (expiry'li, tavanlı). Tüm DB erişimi createAdminClient ile.
import { createAdminClient } from "@/lib/supabase/server";

export type StudioSettings = {
  dailyFree: number;
  orderThreshold: number;
  orderCreditAmount: number;
  expiryDays: number;
  maxEarnedBalance: number;
};

const DEFAULTS: StudioSettings = {
  dailyFree: 3, orderThreshold: 1000, orderCreditAmount: 10, expiryDays: 30, maxEarnedBalance: 50,
};

export async function getSettings(): Promise<StudioSettings> {
  const db = createAdminClient();
  const { data } = await db.from("studio_settings").select("*").eq("id", 1).single();
  if (!data) return DEFAULTS;
  return {
    dailyFree: data.daily_free,
    orderThreshold: Number(data.order_threshold),
    orderCreditAmount: data.order_credit_amount,
    expiryDays: data.expiry_days,
    maxEarnedBalance: data.max_earned_balance,
  };
}

function startOfTodayIso(): string {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString();
}

async function todaySuccessCount(userId: string): Promise<number> {
  const db = createAdminClient();
  const { count } = await db
    .from("studio_jobs")
    .select("id", { count: "exact", head: true })
    .eq("userId", userId).eq("status", "success")
    .gte("createdAt", startOfTodayIso());
  return count ?? 0;
}

async function earnedAvailable(userId: string): Promise<number> {
  const db = createAdminClient();
  const { data } = await db
    .from("studio_credit_grants")
    .select("remaining")
    .eq("userId", userId).gt("remaining", 0).gt("expiresAt", new Date().toISOString());
  return (data ?? []).reduce((a, g) => a + g.remaining, 0);
}

export type CreditStatus = { dailyFreeRemaining: number; earnedAvailable: number; total: number };

export async function getCreditStatus(userId: string): Promise<CreditStatus> {
  const s = await getSettings();
  const used = await todaySuccessCount(userId);
  const dailyFreeRemaining = Math.max(0, s.dailyFree - used);
  const earned = await earnedAvailable(userId);
  return { dailyFreeRemaining, earnedAvailable: earned, total: dailyFreeRemaining + earned };
}

/** İşlemden ÖNCE kontrol: kullanıcının harcayacak kredisi var mı? */
export async function hasCredit(userId: string): Promise<boolean> {
  const { total } = await getCreditStatus(userId);
  return total > 0;
}

/** Başarılı işlemi kaydet. Günlük ücretsiz dolmuşsa en yakın expiry'li grant'tan 1 düş. */
export async function recordSuccess(userId: string, tool: string): Promise<void> {
  const db = createAdminClient();
  const s = await getSettings();
  const used = await todaySuccessCount(userId); // bu insert'ten ÖNCE
  if (used >= s.dailyFree) {
    const { data: grant } = await db
      .from("studio_credit_grants")
      .select("id, remaining")
      .eq("userId", userId).gt("remaining", 0).gt("expiresAt", new Date().toISOString())
      .order("expiresAt", { ascending: true }).limit(1).single();
    if (grant) {
      await db.from("studio_credit_grants").update({ remaining: grant.remaining - 1 }).eq("id", grant.id);
    }
  }
  await db.from("studio_jobs").insert({ userId, tool, status: "success" });
}

/** Hatalı işlem — kredi harcanmaz, yalnız kayıt. */
export async function recordError(userId: string, tool: string): Promise<void> {
  const db = createAdminClient();
  await db.from("studio_jobs").insert({ userId, tool, status: "error" });
}

/** Sipariş ödendiğinde bonus kredi ver (eşik + tavan kırpması). */
export async function grantOrderCredits(userId: string, orderTotal: number, orderId: string): Promise<void> {
  const s = await getSettings();
  if (orderTotal < s.orderThreshold) return;
  const earned = await earnedAvailable(userId);
  const grant = Math.min(s.orderCreditAmount, Math.max(0, s.maxEarnedBalance - earned));
  if (grant <= 0) return;
  const expiresAt = new Date(Date.now() + s.expiryDays * 86_400_000).toISOString();
  const db = createAdminClient();
  await db.from("studio_credit_grants").insert({
    userId, amount: grant, remaining: grant, expiresAt, source: "order", orderId,
  });
}

/** Admin manuel düzeltme. delta>0 → grant ekle; delta<0 → en yakın expiry'den düş. */
export async function adjustCredits(userId: string, delta: number, note?: string): Promise<void> {
  const db = createAdminClient();
  if (delta > 0) {
    const s = await getSettings();
    const expiresAt = new Date(Date.now() + s.expiryDays * 86_400_000).toISOString();
    await db.from("studio_credit_grants").insert({
      userId, amount: delta, remaining: delta, expiresAt, source: "manual", note: note ?? null,
    });
    return;
  }
  let toRemove = -delta;
  const { data: grants } = await db
    .from("studio_credit_grants")
    .select("id, remaining")
    .eq("userId", userId).gt("remaining", 0).gt("expiresAt", new Date().toISOString())
    .order("expiresAt", { ascending: true });
  for (const g of grants ?? []) {
    if (toRemove <= 0) break;
    const dec = Math.min(g.remaining, toRemove);
    await db.from("studio_credit_grants").update({ remaining: g.remaining - dec }).eq("id", g.id);
    toRemove -= dec;
  }
}
