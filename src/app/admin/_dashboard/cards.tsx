import Link from "next/link";

const tl = (n: number) => `${n.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺`;

// KPI kartı içi mini-trend (son 14 gün) — eksensiz SVG sparkline
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const W = 100, H = 28;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const x = (i: number) => (i * W) / (data.length - 1);
  const y = (v: number) => H - 2 - ((v - min) / range) * (H - 4);
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-7 mt-2" preserveAspectRatio="none" aria-hidden="true">
      <path d={line} fill="none" stroke="#e07a5f" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// KPI kartı — delta null ise rozet gizli; series varsa sparkline
export function StatCard({ label, value, delta, series }: { label: string; value: string; delta?: number | null; series?: number[] }) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <p className="text-sm text-text-light mb-1">{label}</p>
      <p className="font-serif text-2xl text-text">{value}</p>
      {delta != null && (
        <p className={`text-xs font-semibold mt-1 ${up ? "text-green-600" : "text-red-600"}`}>
          {up ? "▲" : "▼"} %{Math.abs(delta * 100).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
          <span className="text-text-light font-normal"> önceki döneme göre</span>
        </p>
      )}
      {series && series.length > 1 && <Sparkline data={series} />}
    </div>
  );
}

const ACTION = [
  { key: "PENDING", label: "Bekleyen", urgent: true },
  { key: "PREPARING", label: "Hazırlanıyor", urgent: false },
  { key: "SHIPPED", label: "Kargoda", urgent: false },
  { key: "CANCEL_REQUESTED", label: "İptal Talebi", urgent: true },
] as const;

export function ActionBar({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {ACTION.map((a) => {
        const n = counts[a.key] ?? 0;
        const hot = a.urgent && n > 0;
        return (
          <Link key={a.key} href={`/admin/siparisler?status=${a.key}`}
            className={`rounded-2xl border p-4 transition-colors ${hot ? "border-primary bg-primary/5 hover:bg-primary/10" : "border-border bg-white hover:bg-bg"}`}>
            <p className="text-sm text-text-light">{a.label}</p>
            <p className={`font-serif text-2xl ${hot ? "text-primary" : "text-text"}`}>{n}</p>
          </Link>
        );
      })}
    </div>
  );
}

export function TopProducts({ items }: { items: { name: string; quantity: number; revenue: number }[] }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h2 className="font-serif text-lg text-text mb-4">En Çok Satanlar</h2>
      {!items.length ? <p className="text-sm text-text-light">Veri yok.</p> : (
        <ul className="flex flex-col gap-3">
          {items.map((p, i) => (
            <li key={p.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-text-light w-4">{i + 1}</span>
                <span className="text-sm text-text truncate">{p.name}</span>
              </span>
              <span className="text-sm text-text-light whitespace-nowrap">{p.quantity} adet · <span className="text-primary font-semibold">{tl(p.revenue)}</span></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AiActivityCard({ ai }: { ai: { total: number; success: number; granted: number } }) {
  const ratio = ai.total ? Math.round((ai.success / ai.total) * 100) : 0;
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h2 className="font-serif text-lg text-text mb-4">AI Stüdyo</h2>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div><p className="font-serif text-2xl text-text">{ai.total}</p><p className="text-xs text-text-light">İşlem</p></div>
        <div><p className="font-serif text-2xl text-text">%{ratio}</p><p className="text-xs text-text-light">Başarı</p></div>
        <div><p className="font-serif text-2xl text-text">{ai.granted}</p><p className="text-xs text-text-light">Kredi</p></div>
      </div>
    </div>
  );
}

export function MarketingCard({ campaigns, coupons }: {
  campaigns: { title: string }[];
  coupons: { code: string; expires_at: string | null; expired: boolean }[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h2 className="font-serif text-lg text-text mb-4">Pazarlama</h2>
      <p className="text-xs font-semibold text-text-light mb-1">Aktif Kampanyalar ({campaigns.length})</p>
      {campaigns.length ? (
        <ul className="text-sm text-text mb-3 flex flex-col gap-0.5">{campaigns.slice(0, 4).map((c) => <li key={c.title} className="truncate">• {c.title}</li>)}</ul>
      ) : <p className="text-sm text-text-light mb-3">Aktif kampanya yok.</p>}
      <p className="text-xs font-semibold text-text-light mb-1">Süresi Dolacak/Dolmuş Kuponlar</p>
      {coupons.length ? (
        <ul className="text-sm flex flex-col gap-0.5">
          {coupons.slice(0, 5).map((c) => (
            <li key={c.code} className={c.expired ? "text-red-600" : "text-amber-600"}>
              {c.code} — {c.expired ? "doldu" : c.expires_at?.slice(0, 10)}
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-text-light">Yakında dolacak kupon yok.</p>}
    </div>
  );
}

const ACT_LABEL: Record<string, string> = {
  PENDING: "Beklemede", PREPARING: "Hazırlanıyor", SHIPPED: "Kargoda",
  DELIVERED: "Teslim", CANCELLED: "İptal", CANCEL_REQUESTED: "İptal Talebi",
};
const ACT_CLS: Record<string, string> = {
  PENDING: "text-yellow-700 bg-yellow-50", PREPARING: "text-blue-700 bg-blue-50",
  SHIPPED: "text-purple-700 bg-purple-50", DELIVERED: "text-green-700 bg-green-50",
  CANCELLED: "text-red-700 bg-red-50", CANCEL_REQUESTED: "text-orange-700 bg-orange-50",
};

// Son aktivite feed'i (glean deseni): zaman damgası + durum rozeti + tutar, tıklanır
export function RecentActivity({ orders }: { orders: { id: string; status: string; total: number | string; createdAt: string }[] }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h2 className="font-serif text-lg text-text mb-4">Son Aktivite</h2>
      {!orders.length ? <p className="text-sm text-text-light">Henüz sipariş yok.</p> : (
        <ul className="flex flex-col divide-y divide-border">
          {orders.map((o) => (
            <li key={o.id} className="py-2.5 first:pt-0 last:pb-0">
              <Link href={`/siparisler/${o.id}`} className="flex items-center justify-between gap-3 hover:opacity-80">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs text-text-light">#{o.id.slice(0, 8).toUpperCase()}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACT_CLS[o.status] ?? "text-text-light bg-bg"}`}>{ACT_LABEL[o.status] ?? o.status}</span>
                </span>
                <span className="flex items-center gap-3 whitespace-nowrap">
                  <span className="text-xs text-text-light">{new Date(o.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="text-sm font-semibold text-primary">{Number(o.total).toLocaleString("tr-TR")} ₺</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AttentionCard({ products }: { products: { id: string; name: string; isActive: boolean | null; images: string[] | null }[] }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h2 className="font-serif text-lg text-text mb-4">Dikkat Gerektiren Ürünler</h2>
      {!products.length ? <p className="text-sm text-text-light">Sorun yok 👍</p> : (
        <ul className="flex flex-col gap-2">
          {products.slice(0, 6).map((p) => {
            const reason = p.isActive === false ? "pasif" : "görselsiz";
            return (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <Link href={`/admin/urunler/${p.id}/duzenle`} className="text-sm text-text hover:text-primary truncate">{p.name}</Link>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">{reason}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function LeastSold({ items }: { items: { name: string; slug: string; orderCount: number }[] }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h2 className="font-serif text-lg text-text mb-4">En Az Satanlar</h2>
      {!items.length ? <p className="text-sm text-text-light">Veri yok.</p> : (
        <ul className="flex flex-col gap-3">
          {items.map((p) => (
            <li key={p.slug} className="flex items-center justify-between gap-3">
              <span className="text-sm text-text truncate">{p.name}</span>
              <span className="text-sm text-text-light whitespace-nowrap">{p.orderCount} sipariş</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Trending({ items }: { items: { name: string; quantity: number }[] }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h2 className="font-serif text-lg text-text mb-4">Trend Olanlar <span className="text-xs font-normal text-text-light">· son 7 gün</span></h2>
      {!items.length ? <p className="text-sm text-text-light">Son 7 günde sipariş yok.</p> : (
        <ul className="flex flex-col gap-3">
          {items.map((p, i) => (
            <li key={p.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-text-light w-4">{i + 1}</span>
                <span className="text-sm text-text truncate">{p.name}</span>
              </span>
              <span className="text-sm font-semibold text-primary whitespace-nowrap">{p.quantity} adet</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReprintStats({ stats }: { stats: { total: number; reasons: { reason: string; count: number }[]; rate: number } }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h2 className="font-serif text-lg text-text mb-4">Tekrar Baskı</h2>
      <div className="flex items-baseline gap-6 mb-3">
        <span><span className="font-serif text-2xl text-text">{stats.total}</span> <span className="text-xs text-text-light">toplam</span></span>
        <span><span className="font-serif text-2xl text-text">%{(stats.rate * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}</span> <span className="text-xs text-text-light">satışa oran</span></span>
      </div>
      {stats.reasons.length ? (
        <ul className="text-sm flex flex-col gap-1 pt-3 border-t border-border">
          {stats.reasons.map((r) => (
            <li key={r.reason} className="flex justify-between gap-3"><span className="text-text-light truncate">{r.reason}</span><span className="text-text font-semibold">{r.count}</span></li>
          ))}
        </ul>
      ) : <p className="text-sm text-text-light">Henüz tekrar baskı yok.</p>}
    </div>
  );
}

export function AiFunnel({ data }: { data: { studioUsers: number; converted: number; conversion: number | null; byTool: { tool: string; count: number }[] } }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h2 className="font-serif text-lg text-text mb-4">AI Stüdyo → Sipariş</h2>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div><p className="font-serif text-2xl text-text">{data.studioUsers}</p><p className="text-xs text-text-light">AI kullanan</p></div>
        <div><p className="font-serif text-2xl text-text">{data.converted}</p><p className="text-xs text-text-light">sipariş verdi</p></div>
        <div><p className="font-serif text-2xl text-text">{data.conversion != null ? `%${Math.round(data.conversion * 100)}` : "—"}</p><p className="text-xs text-text-light">dönüşüm</p></div>
      </div>
      {data.byTool.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-border">
          {data.byTool.map((t) => (
            <span key={t.tool} className="text-xs px-2 py-1 rounded-lg bg-bg text-text-light">{t.tool}: <span className="text-text font-semibold">{t.count}</span></span>
          ))}
        </div>
      )}
    </div>
  );
}
