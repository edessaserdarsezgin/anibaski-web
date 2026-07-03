import { createAdminClient } from "@/lib/supabase/server";

export type ReportRange = { fromIso: string; toIso: string; fromDate: string; toDate: string };

function istanbulDay(at: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

/** YYYY-MM-DD from/to → İstanbul ISO sınırları. Geçersizse son 30 gün. from>to ise swap. */
export function parseRange(from?: string, to?: string): ReportRange {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  let fromDate = from && re.test(from) ? from : "";
  let toDate = to && re.test(to) ? to : "";
  if (!toDate) toDate = istanbulDay(new Date());
  if (!fromDate) {
    const d = new Date(); d.setDate(d.getDate() - 30);
    fromDate = istanbulDay(d);
  }
  if (fromDate > toDate) { const t = fromDate; fromDate = toDate; toDate = t; }
  return {
    fromDate, toDate,
    fromIso: new Date(`${fromDate}T00:00:00+03:00`).toISOString(),
    toIso: new Date(`${toDate}T23:59:59.999+03:00`).toISOString(),
  };
}

const num = (v: number | string | null | undefined) => Number(v ?? 0);

export type ReportOrder = {
  id: string; createdAt: string; status: string; total: number;
  paymentMethod: string | null; paymentStatus: string | null; customerName: string;
};
export type ReportItem = { name: string; quantity: number; unitPrice: number; status: string };
export type ReportData = { orders: ReportOrder[]; items: ReportItem[] };

const isPaid = (o: { paymentMethod: string | null; paymentStatus: string | null }) =>
  o.paymentMethod === "cod" || o.paymentStatus === "paid";
const CANCELLED = new Set(["CANCELLED", "CANCEL_REQUESTED"]);

type RawOrder = {
  id: string; createdAt: string; status: string; total: number | string;
  paymentMethod: string | null; paymentStatus: string | null;
  address: { fullName: string | null } | null;
  buyer: { fullName: string | null; email: string | null } | null;
};
type RawItem = { quantity: number; unitPrice: number | string; product: { name: string } | null; order: { status: string } | null };

export async function fetchReportData(r: ReportRange): Promise<ReportData> {
  const db = createAdminClient();
  const [{ data: ordersRaw }, { data: itemsRaw }] = await Promise.all([
    db.from("orders")
      .select(`id, status, total, "createdAt", "paymentMethod", "paymentStatus", address:addresses!orders_addressId_fkey(fullName), buyer:profiles!orders_userId_fkey(fullName, email)`)
      .eq("type", "sale").gte("createdAt", r.fromIso).lte("createdAt", r.toIso)
      .order("createdAt", { ascending: false }),
    db.from("order_items")
      .select(`quantity, "unitPrice", product:products(name), order:orders!inner(status, type, "createdAt")`)
      .eq("order.type", "sale").gte("order.createdAt", r.fromIso).lte("order.createdAt", r.toIso),
  ]);
  const orders: ReportOrder[] = ((ordersRaw ?? []) as unknown as RawOrder[]).map((o) => ({
    id: o.id, createdAt: o.createdAt, status: o.status, total: num(o.total),
    paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
    customerName: o.address?.fullName || o.buyer?.fullName || o.buyer?.email || "—",
  }));
  const items: ReportItem[] = ((itemsRaw ?? []) as unknown as RawItem[]).map((it) => ({
    name: it.product?.name ?? "—", quantity: it.quantity, unitPrice: num(it.unitPrice),
    status: it.order?.status ?? "",
  }));
  return { orders, items };
}

export function summarize(orders: ReportOrder[]) {
  const paid = orders.filter(isPaid);
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  const count = paid.length;
  return { revenue, count, avg: count ? revenue / count : 0, cancelledCount: orders.filter((o) => CANCELLED.has(o.status)).length };
}

export function byStatus(orders: ReportOrder[]) {
  const m = new Map<string, number>();
  for (const o of orders) m.set(o.status, (m.get(o.status) ?? 0) + 1);
  return [...m.entries()].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
}

export function byPayment(orders: ReportOrder[]) {
  const paid = orders.filter(isPaid);
  const m = new Map<string, { count: number; revenue: number }>();
  for (const o of paid) {
    const method = o.paymentMethod === "cod" ? "Kapıda Ödeme" : "PayTR (Kart)";
    const e = m.get(method) ?? { count: 0, revenue: 0 };
    e.count += 1; e.revenue += o.total; m.set(method, e);
  }
  return [...m.entries()].map(([method, v]) => ({ method, ...v }));
}

export function byProduct(items: ReportItem[]) {
  const m = new Map<string, { name: string; quantity: number; revenue: number; cancelledQty: number }>();
  for (const it of items) {
    const e = m.get(it.name) ?? { name: it.name, quantity: 0, revenue: 0, cancelledQty: 0 };
    if (CANCELLED.has(it.status)) e.cancelledQty += it.quantity;
    else { e.quantity += it.quantity; e.revenue += it.quantity * it.unitPrice; }
    m.set(it.name, e);
  }
  return [...m.values()].sort((a, b) => b.revenue - a.revenue);
}
