import { unstable_noStore as noStore } from "next/cache";
import { parseRange, fetchReportData, summarize, byStatus, byPayment, byProduct } from "@/lib/reports";
import DateRangePicker from "./DateRangePicker";
import ReportActions from "./ReportActions";

export const metadata = { title: "Satış Raporları | Admin" };

const tl = (n: number) => `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" });
const STATUS_TR: Record<string, string> = { PENDING: "Beklemede", PREPARING: "Hazırlanıyor", SHIPPED: "Kargoda", DELIVERED: "Teslim", CANCELLED: "İptal", CANCEL_REQUESTED: "İptal Talebi" };

type Props = { searchParams: Promise<{ from?: string; to?: string }> };

export default async function RaporlarPage({ searchParams }: Props) {
  noStore();
  const { from, to } = await searchParams;
  const range = parseRange(from, to);
  const { orders, items } = await fetchReportData(range);
  const s = summarize(orders);
  const statuses = byStatus(orders);
  const payments = byPayment(orders);
  const products = byProduct(items);

  const cards = [
    { label: "Toplam ciro", value: tl(s.revenue) },
    { label: "Sipariş sayısı", value: s.count },
    { label: "Ortalama sepet", value: tl(s.avg) },
    { label: "İptal / iade", value: s.cancelledCount },
  ];
  const box = "bg-white rounded-2xl border border-border";

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <h1 className="font-serif text-3xl text-text">Satış Raporları</h1>
        <DateRangePicker from={range.fromDate} to={range.toDate} />
      </div>
      <p className="text-sm text-text-light mb-4">{fmtDate(range.fromIso)} – {fmtDate(range.toIso)} arası (ödenmiş satışlar).</p>
      <div className="mb-8"><ReportActions orders={orders} products={products} range={range} /></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className={`${box} p-5`}>
            <p className="text-xs text-text-light mb-1">{c.label}</p>
            <p className="font-serif text-2xl text-text">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <section className={box}>
          <h2 className="font-serif text-lg text-text px-6 pt-6 pb-3">Durum Dağılımı</h2>
          {!statuses.length ? <p className="text-sm text-text-light px-6 pb-6">Kayıt yok.</p> : (
            <table className="w-full text-sm"><tbody>
              {statuses.map((r) => (
                <tr key={r.status} className="border-t border-border">
                  <td className="px-6 py-2.5 text-text">{STATUS_TR[r.status] ?? r.status}</td>
                  <td className="px-6 py-2.5 text-right text-text-light">{r.count}</td>
                </tr>
              ))}
            </tbody></table>
          )}
        </section>
        <section className={box}>
          <h2 className="font-serif text-lg text-text px-6 pt-6 pb-3">Ödeme Dağılımı</h2>
          {!payments.length ? <p className="text-sm text-text-light px-6 pb-6">Kayıt yok.</p> : (
            <table className="w-full text-sm"><tbody>
              {payments.map((r) => (
                <tr key={r.method} className="border-t border-border">
                  <td className="px-6 py-2.5 text-text">{r.method}</td>
                  <td className="px-6 py-2.5 text-right text-text-light">{r.count} · {tl(r.revenue)}</td>
                </tr>
              ))}
            </tbody></table>
          )}
        </section>
      </div>

      <section className={`${box} overflow-hidden mb-8`}>
        <h2 className="font-serif text-xl text-text px-6 pt-6 pb-4">Ürün Bazında Satış</h2>
        {!products.length ? <p className="text-sm text-text-light px-6 pb-6">Bu aralıkta satış yok.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-text-light border-t border-border">
              <th className="px-6 py-3 font-medium">Ürün</th>
              <th className="px-6 py-3 font-medium text-right">Satılan Adet</th>
              <th className="px-6 py-3 font-medium text-right">Ciro</th>
              <th className="px-6 py-3 font-medium text-right">İptal Adet</th>
            </tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.name} className="border-t border-border">
                  <td className="px-6 py-2.5 text-text">{p.name}</td>
                  <td className="px-6 py-2.5 text-right text-text">{p.quantity}</td>
                  <td className="px-6 py-2.5 text-right text-text">{tl(p.revenue)}</td>
                  <td className="px-6 py-2.5 text-right text-text-light">{p.cancelledQty || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>

      <section className={`${box} overflow-hidden`}>
        <h2 className="font-serif text-xl text-text px-6 pt-6 pb-4">Sipariş Listesi</h2>
        {!orders.length ? <p className="text-sm text-text-light px-6 pb-6">Bu aralıkta sipariş yok.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-text-light border-t border-border">
              <th className="px-6 py-3 font-medium">Tarih</th>
              <th className="px-6 py-3 font-medium">Sipariş No</th>
              <th className="px-6 py-3 font-medium">Müşteri</th>
              <th className="px-6 py-3 font-medium">Durum</th>
              <th className="px-6 py-3 font-medium">Ödeme</th>
              <th className="px-6 py-3 font-medium text-right">Tutar</th>
            </tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-6 py-2.5 text-text-light whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                  <td className="px-6 py-2.5 text-text font-mono text-xs">{o.id.slice(0, 8)}</td>
                  <td className="px-6 py-2.5 text-text">{o.customerName}</td>
                  <td className="px-6 py-2.5 text-text">{STATUS_TR[o.status] ?? o.status}</td>
                  <td className="px-6 py-2.5 text-text-light">{o.paymentMethod === "cod" ? "Kapıda" : "PayTR"}</td>
                  <td className="px-6 py-2.5 text-right text-text">{tl(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>
    </div>
  );
}
