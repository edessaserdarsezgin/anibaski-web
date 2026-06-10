import Link from "next/link";

const tl = (n: number) => `${n.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺`;

// KPI kartı — delta null ise rozet gizli
export function StatCard({ label, value, delta }: { label: string; value: string; delta?: number | null }) {
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
