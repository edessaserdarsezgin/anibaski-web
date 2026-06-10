import { unstable_noStore as noStore } from "next/cache";
import {
  parseDonem, donemToFromIso, donemToPrevIso,
  fetchDashboardData, aggregateKpis, expiringCoupons,
} from "@/lib/adminStats";
import DonemSecici from "./istatistik/DonemSecici";
import TrendChart from "./_dashboard/TrendChart";
import {
  StatCard, ActionBar, TopProducts, AiActivityCard,
  MarketingCard, AttentionCard, RecentActivity,
  LeastSold, Trending, ReprintStats, AiFunnel,
} from "./_dashboard/cards";

export const metadata = { title: "Genel Bakış | Admin" };

const tl = (n: number) => `${n.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺`;

type Props = { searchParams: Promise<{ donem?: string }> };

export default async function AdminPage({ searchParams }: Props) {
  noStore();
  const { donem: raw } = await searchParams;
  const donem = parseDonem(raw);
  const fromIso = donemToFromIso(donem);
  const prevFromIso = donemToPrevIso(donem, fromIso);

  const data = await fetchDashboardData(fromIso, prevFromIso);
  const kpi = aggregateKpis(data.current, data.previous);
  const coupons = expiringCoupons(data.coupons);

  // Sparkline verileri
  const orderSeries = data.series30.map((s) => s.count);
  const revenueSeries = data.series30.map((s) => s.total);
  const avgBasketSeries = data.series30.map((s) => (s.count ? s.total / s.count : 0));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 className="font-serif text-3xl text-text">Genel Bakış</h1>
        <DonemSecici active={donem} />
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Sipariş" value={String(kpi.count)} delta={kpi.countDelta} series={orderSeries} />
        <StatCard label="Ciro" value={tl(kpi.revenue)} delta={kpi.revenueDelta} series={revenueSeries} />
        <StatCard label="Ort. Sepet" value={tl(kpi.avg)} delta={kpi.avgDelta} series={avgBasketSeries} />
        <StatCard label="AI İşlem" value={String(data.ai.total)} />
      </div>

      {/* Aksiyon */}
      <h2 className="font-serif text-lg text-text mb-3">Aksiyon Bekleyen</h2>
      <div className="mb-8"><ActionBar counts={data.actionCounts} /></div>

      {/* Trend */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-8">
        <h2 className="font-serif text-lg text-text mb-4">Son 30 Gün</h2>
        <TrendChart data={data.series30} />
        <div className="flex gap-4 mt-2 text-xs text-text-light">
          <span><span className="inline-block w-3 h-1.5 bg-primary rounded-sm align-middle" /> Ciro</span>
          <span><span className="inline-block w-3 h-3 bg-accent/60 rounded-sm align-middle" /> Sipariş</span>
        </div>
      </div>

      {/* 2 kolon: son aktivite + en çok satanlar/AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <RecentActivity orders={data.recent} />
        <div className="flex flex-col gap-4">
          <TopProducts items={data.topProducts} />
          <AiActivityCard ai={data.ai} />
        </div>
      </div>

      {/* 2 kolon: pazarlama + dikkat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <MarketingCard campaigns={data.campaigns} coupons={coupons} />
        <AttentionCard products={data.attention} />
      </div>

      {/* 2 kolon: trend olanlar + en az satanlar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <Trending items={data.trending} />
        <LeastSold items={data.leastSold} />
      </div>

      {/* 2 kolon: reprint istatistikleri + AI Stüdyo dönüşümü */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReprintStats stats={data.reprint} />
        <AiFunnel data={data.aiFunnel} />
      </div>
    </div>
  );
}
