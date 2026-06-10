// Admin istatistik veri katmanı — dönem yardımcıları, veri çekme, saf aggregator'lar.
// Tüm DB erişimi createAdminClient ile. Aggregator'lar saf (DB'siz test edilebilir).
import { createAdminClient } from "@/lib/supabase/server";

export type Donem = "gun" | "hafta" | "ay" | "tum";

export function parseDonem(raw: string | undefined): Donem {
  return raw === "gun" || raw === "hafta" || raw === "tum" ? raw : "ay";
}

/** gun → bugün 00:00; hafta → son 7 gün; ay → son 30 gün; tum → null */
export function donemToFromIso(donem: Donem): string | null {
  if (donem === "tum") return null;
  const d = new Date();
  if (donem === "gun") { d.setHours(0, 0, 0, 0); return d.toISOString(); }
  d.setDate(d.getDate() - (donem === "hafta" ? 7 : 30));
  return d.toISOString();
}

const num = (v: number | string | null | undefined) => Number(v ?? 0);

type OrderRow = {
  total: number | string;
  discountCode: string | null;
  discountAmount: number | string | null;
  source: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
};
type CampaignRow = { title: string; coupon_code: string | null };
type JobRow = { tool: string | null; status: string };
type GrantRow = { amount: number | string; source: string };

export type StatsData = {
  orders: OrderRow[];     // yalnız tamamlanmış (cod ∨ paid)
  campaigns: CampaignRow[];
  jobs: JobRow[];
  grants: GrantRow[];
};

export async function fetchAdminStats(fromIso: string | null): Promise<StatsData> {
  const db = createAdminClient();
  // type='reprint' = ücretsiz iş tekrarı → ciroya dahil edilmez (yalnız satış)
  let ordersQ = db.from("orders").select(`total, "discountCode", "discountAmount", source, "paymentMethod", "paymentStatus", "createdAt"`).neq("type", "reprint");
  let jobsQ = db.from("studio_jobs").select(`tool, status, "createdAt"`);
  let grantsQ = db.from("studio_credit_grants").select(`amount, source, "createdAt"`);
  if (fromIso) {
    ordersQ = ordersQ.gte("createdAt", fromIso);
    jobsQ = jobsQ.gte("createdAt", fromIso);
    grantsQ = grantsQ.gte("createdAt", fromIso);
  }
  const [{ data: ordersRaw }, { data: campaigns }, { data: jobs }, { data: grants }] = await Promise.all([
    ordersQ,
    db.from("campaigns").select("title, coupon_code"),
    jobsQ,
    grantsQ,
  ]);
  const orders = (ordersRaw ?? []).filter(
    (o: OrderRow) => o.paymentMethod === "cod" || o.paymentStatus === "paid"
  );
  return {
    orders,
    campaigns: (campaigns ?? []) as CampaignRow[],
    jobs: (jobs ?? []) as JobRow[],
    grants: (grants ?? []) as GrantRow[],
  };
}

export function aggregateCoupons(orders: OrderRow[]) {
  const map = new Map<string, { code: string; count: number; discount: number }>();
  for (const o of orders) {
    if (!o.discountCode) continue;
    const e = map.get(o.discountCode) ?? { code: o.discountCode, count: 0, discount: 0 };
    e.count += 1;
    e.discount += num(o.discountAmount);
    map.set(o.discountCode, e);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function aggregateDiscount(orders: OrderRow[]) {
  const discounted = orders.filter((o) => o.discountCode && num(o.discountAmount) > 0);
  const totalDiscount = discounted.reduce((s, o) => s + num(o.discountAmount), 0);
  const revenue = orders.reduce((s, o) => s + num(o.total), 0);
  return {
    totalDiscount,
    discountedCount: discounted.length,
    totalOrders: orders.length,
    discountedRatio: orders.length ? discounted.length / orders.length : 0,
    revenueRatio: revenue ? totalDiscount / revenue : 0,
  };
}

export function aggregateSource(orders: OrderRow[]) {
  const build = (src: string) => {
    const arr = orders.filter((o) => o.source === src);
    const total = arr.reduce((s, o) => s + num(o.total), 0);
    return { count: arr.length, avgBasket: arr.length ? total / arr.length : 0 };
  };
  return { guided: build("guided"), direct: build("direct") };
}

export function aggregateCampaigns(orders: OrderRow[], campaigns: CampaignRow[]) {
  const couponAgg = new Map<string, { count: number; discount: number }>();
  for (const o of orders) {
    if (!o.discountCode) continue;
    const e = couponAgg.get(o.discountCode) ?? { count: 0, discount: 0 };
    e.count += 1;
    e.discount += num(o.discountAmount);
    couponAgg.set(o.discountCode, e);
  }
  return campaigns.map((c) => {
    const u = c.coupon_code ? couponAgg.get(c.coupon_code) : undefined;
    return { title: c.title, couponCode: c.coupon_code, count: u?.count ?? 0, discount: u?.discount ?? 0 };
  });
}

export function aggregateAi(jobs: JobRow[], grants: GrantRow[]) {
  const total = jobs.length;
  const success = jobs.filter((j) => j.status === "success").length;
  const error = jobs.filter((j) => j.status === "error").length;
  const toolMap = new Map<string, number>();
  for (const j of jobs) {
    const t = j.tool ?? "—";
    toolMap.set(t, (toolMap.get(t) ?? 0) + 1);
  }
  const grantMap = new Map<string, number>();
  for (const g of grants) grantMap.set(g.source, (grantMap.get(g.source) ?? 0) + num(g.amount));
  return {
    total,
    success,
    error,
    successRatio: total ? success / total : 0,
    byTool: [...toolMap.entries()].map(([tool, count]) => ({ tool, count })).sort((a, b) => b.count - a.count),
    grantsBySource: [...grantMap.entries()].map(([source, amount]) => ({ source, amount })),
    grantedTotal: [...grantMap.values()].reduce((s, n) => s + n, 0),
  };
}
