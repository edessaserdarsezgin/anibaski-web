// AI Stüdyo kredi mantığı — tek kaynak. İki kova: günlük ücretsiz (devretmez) +
// kazanılmış (expiry'li, tavanlı). Tüm DB erişimi createAdminClient ile.
import { createAdminClient } from "@/lib/supabase/server";

export type StudioSettings = {
  dailyFree: number;
  trialCredits: number;
  orderThreshold: number;
  orderCreditAmount: number;
  expiryDays: number;
  maxEarnedBalance: number;
};

const DEFAULTS: StudioSettings = {
  dailyFree: 3, trialCredits: 1, orderThreshold: 1000, orderCreditAmount: 10, expiryDays: 30, maxEarnedBalance: 50,
};

export async function getSettings(): Promise<StudioSettings> {
  const db = createAdminClient();
  const { data } = await db.from("studio_settings").select("*").eq("id", 1).single();
  if (!data) return DEFAULTS;
  return {
    dailyFree: data.daily_free,
    trialCredits: data.trial_credits ?? DEFAULTS.trialCredits,
    orderThreshold: Number(data.order_threshold),
    orderCreditAmount: data.order_credit_amount,
    expiryDays: data.expiry_days,
    maxEarnedBalance: data.max_earned_balance,
  };
}

/** Üyenin geçerli (ödenmiş kart veya kapıda) baskı siparişi var mı? Günlük ücretsiz krediyi bu açar. */
async function hasQualifyingOrder(userId: string): Promise<boolean> {
  const db = createAdminClient();
  const { count } = await db
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("userId", userId)
    .or("paymentStatus.eq.paid,paymentMethod.eq.cod");
  return (count ?? 0) > 0;
}

/** Tüm zamanların başarılı işlem sayısı — baskı yapmamış üyenin deneme hakkı buradan ölçülür. */
async function lifetimeSuccessCount(userId: string): Promise<number> {
  const db = createAdminClient();
  const { count } = await db
    .from("studio_jobs")
    .select("id", { count: "exact", head: true })
    .eq("userId", userId).eq("status", "success");
  return count ?? 0;
}

function startOfTodayIso(): string {
  // Günlük ücretsiz kredi TÜRKİYE saatine göre gece 00:00'da yenilenir.
  // createdAt UTC saklandığı için İstanbul'daki bugünün 00:00'ını UTC instant'a çevir.
  // (setHours sunucu yerel saatini kullanır → Vercel UTC'de 03:00 TR'ye kayardı.)
  // Türkiye 2016'dan beri kalıcı UTC+3, yaz saati yok.
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  return new Date(`${ymd}T00:00:00+03:00`).toISOString();
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

// trial=true → üye henüz baskı yapmamış; dailyFreeRemaining "ömür boyu deneme" hakkıdır.
// trial=false → en az bir baskı var; dailyFreeRemaining günlük ücretsiz haktır.
export type CreditStatus = { dailyFreeRemaining: number; earnedAvailable: number; total: number; trial: boolean };

export async function getCreditStatus(userId: string): Promise<CreditStatus> {
  // Bağımsız sorgular paralel; ücretsiz hak sayımı 'ordered'a bağlı olduğu için ikinci turda.
  const [s, ordered, earned] = await Promise.all([
    getSettings(),
    hasQualifyingOrder(userId),
    earnedAvailable(userId),
  ]);

  const used = ordered ? await todaySuccessCount(userId) : await lifetimeSuccessCount(userId);
  const dailyFreeRemaining = ordered
    ? Math.max(0, s.dailyFree - used)
    : Math.max(0, s.trialCredits - used);

  return { dailyFreeRemaining, earnedAvailable: earned, total: dailyFreeRemaining + earned, trial: !ordered };
}

export type CreditStats = {
  usedToday: number;
  usedWeek: number;
  usedMonth: number;
  usedTotal: number;
  grants: { remaining: number; expiresAt: string; source: string }[];
};

/** Kullanım istatistikleri: başarılı işlem sayıları (gün/hafta/ay/toplam) + aktif grant'ların geçerlilik takibi. */
export async function getCreditStats(userId: string): Promise<CreditStats> {
  const db = createAdminClient();
  const now = Date.now();
  const sinceIso = (ms: number) => new Date(now - ms).toISOString();

  async function successCount(fromIso?: string): Promise<number> {
    let q = db
      .from("studio_jobs")
      .select("id", { count: "exact", head: true })
      .eq("userId", userId).eq("status", "success");
    if (fromIso) q = q.gte("createdAt", fromIso);
    const { count } = await q;
    return count ?? 0;
  }

  const [usedToday, usedWeek, usedMonth, usedTotal, grantsRes] = await Promise.all([
    successCount(startOfTodayIso()),
    successCount(sinceIso(7 * 86_400_000)),
    successCount(sinceIso(30 * 86_400_000)),
    successCount(),
    db.from("studio_credit_grants")
      .select("remaining, expiresAt, source")
      .eq("userId", userId).gt("remaining", 0).gt("expiresAt", new Date().toISOString())
      .order("expiresAt", { ascending: true }),
  ]);

  return {
    usedToday, usedWeek, usedMonth, usedTotal,
    grants: (grantsRes.data ?? []) as CreditStats["grants"],
  };
}

/** İşlemden ÖNCE kontrol: kullanıcının harcayacak kredisi var mı? */
export async function hasCredit(userId: string): Promise<boolean> {
  const { total } = await getCreditStatus(userId);
  return total > 0;
}

/** Başarılı işlemi kaydet. Ücretsiz hak (günlük veya deneme) dolmuşsa en yakın expiry'li grant'tan 1 düş. */
export async function recordSuccess(userId: string, tool: string): Promise<void> {
  const db = createAdminClient();
  const s = await getSettings();
  const ordered = await hasQualifyingOrder(userId);
  // Ücretsiz limit: baskı yapan için günlük, yapmayan için ömür boyu deneme.
  const freeLimit = ordered ? s.dailyFree : s.trialCredits;
  const used = ordered ? await todaySuccessCount(userId) : await lifetimeSuccessCount(userId); // insert'ten ÖNCE
  if (used >= freeLimit) {
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
