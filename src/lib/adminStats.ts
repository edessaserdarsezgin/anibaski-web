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
  let ordersQ = db.from("orders").select(`total, discountCode:discount_code, discountAmount:discount_amount, source, "paymentMethod", "paymentStatus", "createdAt"`).neq("type", "reprint");
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

// ─── Dashboard (Genel Bakış) ───────────────────────────────────────────

// Seçili dönemin bir öncesinin başlangıcı (KPI delta karşılaştırması için).
// Pencere: güncel = [fromIso, now], önceki = [prevFromIso, fromIso).
export function donemToPrevIso(donem: Donem, fromIso: string | null): string | null {
  if (!fromIso) return null; // tüm zamanlar → karşılaştırma yok
  const from = new Date(fromIso);
  const days = donem === "gun" ? 1 : donem === "hafta" ? 7 : 30;
  from.setDate(from.getDate() - days);
  return from.toISOString();
}

type DashOrder = { total: number | string; createdAt: string; paymentMethod: string | null; paymentStatus: string | null; userId?: string | null };
type TopItem = { quantity: number; unitPrice: number | string; product: { name: string } | null };
type JobRowFull = { status: string; userId: string | null; tool: string | null };
type AttentionProduct = { id: string; name: string; isActive: boolean | null; images: string[] | null };
type DashCoupon = { code: string; expires_at: string | null; is_active: boolean; discount_type: string; discount_value: number | string };
type DashCampaign = { title: string; is_active: boolean; coupon_code: string | null };

export type DashboardData = {
  current: DashOrder[];
  previous: DashOrder[];
  actionCounts: Record<string, number>;
  series30: { day: string; total: number; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  ai: { total: number; success: number; granted: number };
  coupons: DashCoupon[];
  campaigns: DashCampaign[];
  attention: AttentionProduct[];
  recent: { id: string; status: string; total: number | string; createdAt: string }[];
  leastSold: { name: string; slug: string; orderCount: number }[];
  trending: { name: string; quantity: number }[];
  reprint: { total: number; reasons: { reason: string; count: number }[]; rate: number };
  aiFunnel: { studioUsers: number; converted: number; conversion: number | null; byTool: { tool: string; count: number }[] };
};

// Tamamlanmış sipariş = cod ∨ paid (mevcut kuralla aynı)
const isPaid = (o: { paymentMethod: string | null; paymentStatus: string | null }) =>
  o.paymentMethod === "cod" || o.paymentStatus === "paid";

export async function fetchDashboardData(fromIso: string | null, prevFromIso: string | null): Promise<DashboardData> {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const thirty = new Date(); thirty.setDate(thirty.getDate() - 30);
  const thirtyIso = thirty.toISOString();
  const seven = new Date(); seven.setDate(seven.getDate() - 7);
  const sevenIso = seven.toISOString();

  let curQ = db.from("orders").select(`total, "createdAt", "paymentMethod", "paymentStatus", "userId"`).neq("type", "reprint");
  if (fromIso) curQ = curQ.gte("createdAt", fromIso);

  let prevQ = db.from("orders").select(`total, "createdAt", "paymentMethod", "paymentStatus"`).neq("type", "reprint");
  if (prevFromIso && fromIso) prevQ = prevQ.gte("createdAt", prevFromIso).lt("createdAt", fromIso);
  else prevQ = prevQ.gte("createdAt", now); // tüm zamanlar → boş önceki

  const statuses = ["PENDING", "PREPARING", "SHIPPED", "CANCEL_REQUESTED"];

  // Aksiyon şeridi = operasyonel fulfillment kuyruğu (ciro değil): reprint de
  // basılmayı bekleyen iştir → type filtresi YOK (ciro/KPI sorguları reprint'i
  // ayrıca neq('type','reprint') ile dışlar). Tıklama /admin/siparisler?status=
  // de tüm türleri gösterdiği için tutarlı.
  const [{ data: current }, { data: previous }, ...statusCounts] = await Promise.all([
    curQ, prevQ,
    ...statuses.map((s) =>
      db.from("orders").select("id", { count: "exact", head: true }).eq("status", s)
    ),
  ]);

  const [
    { data: series }, { data: items }, { data: jobs }, { data: grants },
    { data: coupons }, { data: campaigns }, { data: products }, { data: recentRaw },
    { data: leastSoldRaw }, { data: trendItems }, { data: reprintRows }, { count: saleCount },
  ] = await Promise.all([
    db.from("orders").select(`total, "createdAt", "paymentMethod", "paymentStatus"`).neq("type", "reprint").gte("createdAt", thirtyIso),
    db.from("order_items").select(`quantity, "unitPrice", product:products(name), order:orders!inner("createdAt",type)`).eq("order.type", "sale").gte("order.createdAt", fromIso ?? thirtyIso),
    db.from("studio_jobs").select(`status, "userId", tool`).gte("createdAt", fromIso ?? thirtyIso),
    db.from("studio_credit_grants").select(`amount, "createdAt"`).gte("createdAt", fromIso ?? thirtyIso),
    db.from("coupons").select("code, expires_at, is_active, discount_type, discount_value").eq("is_active", true),
    db.from("campaigns").select("title, is_active, coupon_code").eq("is_active", true),
    db.from("products").select(`id, name, "isActive", images`),
    db.from("orders").select(`id, status, total, "createdAt", "paymentMethod", "paymentStatus"`).neq("type", "reprint").order("createdAt", { ascending: false }).limit(12),
    db.from("products_with_order_count").select(`name, slug, "orderCount"`).eq("isActive", true).order("orderCount", { ascending: true }).limit(5),
    db.from("order_items").select(`quantity, "unitPrice", product:products(name), order:orders!inner("createdAt",type)`).eq("order.type", "sale").gte("order.createdAt", sevenIso),
    db.from("orders").select(`"reprintReason"`).eq("type", "reprint"),
    db.from("orders").select("id", { count: "exact", head: true }).eq("type", "sale"),
  ]);

  const actionCounts: Record<string, number> = {};
  statuses.forEach((s, i) => { actionCounts[s] = statusCounts[i]?.count ?? 0; });

  // AI Stüdyo → sipariş: studio kullanıcıları ∩ sipariş veren (tamamlanmış) kullanıcılar
  const orderUserIds = new Set(((current ?? []) as DashOrder[]).filter(isPaid).map((o) => o.userId).filter(Boolean) as string[]);

  return {
    current: (current ?? []) as DashOrder[],
    previous: (previous ?? []) as DashOrder[],
    actionCounts,
    series30: dailySeries((series ?? []) as DashOrder[], thirtyIso),
    topProducts: topProducts((items ?? []) as unknown as TopItem[]),
    ai: {
      total: (jobs ?? []).length,
      success: (jobs ?? []).filter((j: { status: string }) => j.status === "success").length,
      granted: (grants ?? []).reduce((s: number, g: { amount: number | string }) => s + num(g.amount), 0),
    },
    coupons: (coupons ?? []) as DashCoupon[],
    campaigns: (campaigns ?? []) as DashCampaign[],
    // images default '{}' (null değil) → görselsiz = boş dizi; JS'te süz
    attention: ((products ?? []) as AttentionProduct[]).filter((p) => p.isActive === false || !(p.images?.length)),
    // son aktivite: tamamlanmış (cod ∨ paid) son 6 sipariş
    recent: ((recentRaw ?? []) as ({ id: string; status: string; total: number | string; createdAt: string } & { paymentMethod: string | null; paymentStatus: string | null })[])
      .filter(isPaid).slice(0, 6),
    leastSold: (leastSoldRaw ?? []) as { name: string; slug: string; orderCount: number }[],
    trending: trendingProducts((trendItems ?? []) as unknown as TopItem[]),
    reprint: reprintStats((reprintRows ?? []) as { reprintReason: string | null }[], saleCount ?? 0),
    aiFunnel: aiFunnel((jobs ?? []) as unknown as JobRowFull[], orderUserIds),
  };
}

// KPI: tamamlanmış siparişlerden ciro/adet/ort.sepet + önceki döneme % delta
export function aggregateKpis(current: DashOrder[], previous: DashOrder[]) {
  const cur = current.filter(isPaid);
  const prev = previous.filter(isPaid);
  const sum = (a: DashOrder[]) => a.reduce((s, o) => s + num(o.total), 0);
  const revenue = sum(cur), prevRevenue = sum(prev);
  const count = cur.length, prevCount = prev.length;
  const avg = count ? revenue / count : 0;
  const prevAvg = prevCount ? prevRevenue / prevCount : 0;
  const delta = (c: number, p: number) => (p > 0 ? (c - p) / p : null);
  return {
    revenue, count, avg,
    revenueDelta: delta(revenue, prevRevenue),
    countDelta: delta(count, prevCount),
    avgDelta: delta(avg, prevAvg),
  };
}

// Son 30 gün: gün başına ciro + adet (boş günler 0 ile doldurulur)
export function dailySeries(orders: DashOrder[], fromIso: string): { day: string; total: number; count: number }[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const o of orders.filter(isPaid)) {
    const day = o.createdAt.slice(0, 10);
    const e = map.get(day) ?? { total: 0, count: 0 };
    e.total += num(o.total); e.count += 1;
    map.set(day, e);
  }
  const out: { day: string; total: number; count: number }[] = [];
  const today = new Date();
  for (let cur = new Date(fromIso); cur <= today; cur.setDate(cur.getDate() + 1)) {
    const key = cur.toISOString().slice(0, 10);
    const e = map.get(key) ?? { total: 0, count: 0 };
    out.push({ day: key, total: e.total, count: e.count });
  }
  return out;
}

// En çok satan ilk 5 ürün (adet + ciro)
export function topProducts(items: TopItem[]): { name: string; quantity: number; revenue: number }[] {
  const map = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const it of items) {
    const name = it.product?.name ?? "—";
    const e = map.get(name) ?? { name, quantity: 0, revenue: 0 };
    e.quantity += it.quantity;
    e.revenue += it.quantity * num(it.unitPrice);
    map.set(name, e);
  }
  return [...map.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
}

// Pazarlama: 14 gün içinde dolacak VEYA dolmuş ama hâlâ aktif kuponlar
export function expiringCoupons(coupons: DashCoupon[]): { code: string; expires_at: string | null; expired: boolean }[] {
  const limit = new Date(); limit.setDate(limit.getDate() + 14);
  const now = new Date();
  return coupons
    .filter((c) => c.expires_at && new Date(c.expires_at) <= limit)
    .map((c) => ({ code: c.code, expires_at: c.expires_at, expired: !!c.expires_at && new Date(c.expires_at) < now }))
    .sort((a, b) => (a.expires_at ?? "").localeCompare(b.expires_at ?? ""));
}

// Trend olan ürünler: son 7 günde adet bazında en çok sipariş edilen ilk 5
export function trendingProducts(items: TopItem[]): { name: string; quantity: number }[] {
  const map = new Map<string, number>();
  for (const it of items) {
    const name = it.product?.name ?? "—";
    map.set(name, (map.get(name) ?? 0) + it.quantity);
  }
  return [...map.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}

// Reprint istatistikleri: toplam + sebep dağılımı + satışa oran
export function reprintStats(rows: { reprintReason: string | null }[], saleCount: number) {
  const total = rows.length;
  const rmap = new Map<string, number>();
  for (const r of rows) {
    const reason = r.reprintReason?.trim() || "Belirtilmemiş";
    rmap.set(reason, (rmap.get(reason) ?? 0) + 1);
  }
  const reasons = [...rmap.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
  return { total, reasons, rate: saleCount > 0 ? total / saleCount : 0 };
}

// AI Stüdyo → sipariş dönüşümü: studio kullanan kullanıcılar ∩ sipariş veren + araç bazında işlem
export function aiFunnel(jobs: JobRowFull[], orderUserIds: Set<string>) {
  const studioUserIds = new Set(jobs.map((j) => j.userId).filter(Boolean) as string[]);
  const converted = [...studioUserIds].filter((id) => orderUserIds.has(id)).length;
  const studioUsers = studioUserIds.size;
  const tmap = new Map<string, number>();
  for (const j of jobs) { const t = j.tool ?? "—"; tmap.set(t, (tmap.get(t) ?? 0) + 1); }
  const byTool = [...tmap.entries()].map(([tool, count]) => ({ tool, count })).sort((a, b) => b.count - a.count);
  return { studioUsers, converted, conversion: studioUsers > 0 ? converted / studioUsers : null, byTool };
}
