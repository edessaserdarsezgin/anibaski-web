import { unstable_noStore as noStore } from "next/cache";
import {
  parseDonem, donemToFromIso, fetchAdminStats,
  aggregateCoupons, aggregateDiscount, aggregateSource, aggregateCampaigns, aggregateAi,
} from "@/lib/adminStats";
import DonemSecici from "./DonemSecici";

export const metadata = { title: "İstatistik | Admin" };

const tl = (n: number) => `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺`;
const pct = (r: number) => `%${(r * 100).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`;

const SOURCE_LABEL: Record<string, string> = { order: "Sipariş bonusu", manual: "Admin (manuel)" };

type Props = { searchParams: Promise<{ donem?: string }> };

export default async function IstatistikPage({ searchParams }: Props) {
  noStore();
  const { donem: raw } = await searchParams;
  const donem = parseDonem(raw);
  const data = await fetchAdminStats(donemToFromIso(donem));

  const coupons = aggregateCoupons(data.orders);
  const discount = aggregateDiscount(data.orders);
  const source = aggregateSource(data.orders);
  const campaigns = aggregateCampaigns(data.orders, data.campaigns);
  const ai = aggregateAi(data.jobs, data.grants);

  const cards = [
    { label: "Kupon kullanımı", value: discount.discountedCount },
    { label: "Toplam indirim", value: tl(discount.totalDiscount) },
    { label: "İndirimli sipariş oranı", value: pct(discount.discountedRatio) },
    { label: "AI işlem", value: ai.total },
    { label: "AI başarı oranı", value: pct(ai.successRatio) },
    { label: "Verilen kredi", value: ai.grantedTotal },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <h1 className="font-serif text-3xl text-text">İstatistik</h1>
        <DonemSecici active={donem} />
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-border p-5">
            <p className="text-xs text-text-light mb-1">{c.label}</p>
            <p className="font-serif text-2xl text-text">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Kupon kullanımı */}
      <section className="bg-white rounded-2xl border border-border overflow-hidden mb-6">
        <h2 className="font-serif text-xl text-text px-6 pt-6 pb-4">Kupon Kullanımı</h2>
        {!coupons.length ? (
          <p className="text-sm text-text-light px-6 pb-6">Bu dönemde kupon kullanılmadı.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-y border-border bg-bg text-text-light">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Kod</th>
                <th className="text-center px-4 py-3 font-semibold">Kullanım</th>
                <th className="text-right px-6 py-3 font-semibold">Toplam İndirim</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.code} className="border-b border-border last:border-0">
                  <td className="px-6 py-3 font-mono text-text">{c.code}</td>
                  <td className="px-4 py-3 text-center">{c.count}</td>
                  <td className="px-6 py-3 text-right font-semibold text-primary">{tl(c.discount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* AI Stüdyo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <section className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-xl text-text mb-5">AI Stüdyo</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div><dt className="text-xs text-text-light mb-1">Toplam işlem</dt><dd className="font-serif text-2xl text-text">{ai.total}</dd></div>
            <div><dt className="text-xs text-text-light mb-1">Başarı oranı</dt><dd className="font-serif text-2xl text-primary">{pct(ai.successRatio)}</dd></div>
            <div><dt className="text-xs text-text-light mb-1">Başarılı</dt><dd className="font-serif text-2xl text-text">{ai.success}</dd></div>
            <div><dt className="text-xs text-text-light mb-1">Hatalı</dt><dd className="font-serif text-2xl text-text">{ai.error}</dd></div>
          </dl>
          <div className="mt-6">
            <p className="text-xs text-text-light mb-2">Araç bazında kullanım</p>
            {!ai.byTool.length ? (
              <p className="text-sm text-text-light">Veri yok.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {ai.byTool.map((t) => (
                  <li key={t.tool} className="flex justify-between text-sm border-b border-border last:border-0 py-1">
                    <span className="text-text">{t.tool}</span>
                    <span className="text-text-light">{t.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-xl text-text mb-5">Verilen Kredi (kaynak bazında)</h2>
          {!ai.grantsBySource.length ? (
            <p className="text-sm text-text-light">Bu dönemde kredi verilmedi.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {ai.grantsBySource.map((g) => (
                <li key={g.source} className="flex justify-between text-sm border-b border-border last:border-0 py-2">
                  <span className="text-text">{SOURCE_LABEL[g.source] ?? g.source}</span>
                  <span className="font-semibold text-text">{g.amount}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-text-light mt-4">Deneme ve günlük ücretsiz krediler grant değildir; burada görünmez.</p>
        </section>
      </div>

      {/* İndirim etkisi */}
      <section className="bg-white rounded-2xl border border-border p-6 mb-6">
        <h2 className="font-serif text-xl text-text mb-5">İndirim Etkisi</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><dt className="text-xs text-text-light mb-1">Toplam indirim</dt><dd className="font-serif text-2xl text-primary">{tl(discount.totalDiscount)}</dd></div>
          <div><dt className="text-xs text-text-light mb-1">İndirimli / toplam sipariş</dt><dd className="font-serif text-2xl text-text">{discount.discountedCount} / {discount.totalOrders}</dd></div>
          <div><dt className="text-xs text-text-light mb-1">İndirimin ciroya oranı</dt><dd className="font-serif text-2xl text-text">{pct(discount.revenueRatio)}</dd></div>
        </dl>
      </section>

      {/* Kampanya */}
      <section className="bg-white rounded-2xl border border-border overflow-hidden mb-6">
        <h2 className="font-serif text-xl text-text px-6 pt-6 pb-2">Kampanya</h2>
        <p className="text-xs text-text-light px-6 pb-4">Rakamlar bağlı kupon üzerinden dolaylıdır; tıklama/dönüşüm takibi yok.</p>
        {!campaigns.length ? (
          <p className="text-sm text-text-light px-6 pb-6">Kampanya yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-y border-border bg-bg text-text-light">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Kampanya</th>
                <th className="text-left px-4 py-3 font-semibold">Bağlı Kupon</th>
                <th className="text-center px-4 py-3 font-semibold">Kullanım</th>
                <th className="text-right px-6 py-3 font-semibold">İndirim</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-6 py-3 text-text">{c.title}</td>
                  <td className="px-4 py-3 font-mono text-text-light">{c.couponCode ?? <span className="text-text-light italic">kupon bağlı değil</span>}</td>
                  <td className="px-4 py-3 text-center">{c.count}</td>
                  <td className="px-6 py-3 text-right font-semibold text-primary">{tl(c.discount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Kaynak karşılaştırması (analytics'ten taşınan) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-xl text-text mb-5">AI Yolu</h2>
          <dl className="flex flex-col gap-4">
            <div><dt className="text-xs text-text-light mb-1">Toplam sipariş</dt><dd className="font-serif text-2xl text-text">{source.ai.count}</dd></div>
            <div><dt className="text-xs text-text-light mb-1">Ortalama sepet</dt><dd className="font-serif text-2xl text-primary">{tl(source.ai.avgBasket)}</dd></div>
          </dl>
        </div>
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-serif text-xl text-text mb-5">Normal Yol</h2>
          <dl className="flex flex-col gap-4">
            <div><dt className="text-xs text-text-light mb-1">Toplam sipariş</dt><dd className="font-serif text-2xl text-text">{source.direct.count}</dd></div>
            <div><dt className="text-xs text-text-light mb-1">Ortalama sepet</dt><dd className="font-serif text-2xl text-text">{tl(source.direct.avgBasket)}</dd></div>
          </dl>
        </div>
      </section>
    </div>
  );
}
