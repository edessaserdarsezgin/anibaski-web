// Kredi kullanım istatistikleri + geçerlilik takibi. Saf görünüm bileşeni
// (hook yok) — hem sunucu (profil) hem istemci (admin CreditManager) tarafında kullanılır.
import type { CreditStats } from "@/lib/studioCredits";

export default function CreditStatsView({ stats }: { stats: CreditStats }) {
  const items: { label: string; value: number }[] = [
    { label: "Bugün", value: stats.usedToday },
    { label: "Bu hafta", value: stats.usedWeek },
    { label: "Bu ay", value: stats.usedMonth },
    { label: "Toplam", value: stats.usedTotal },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs text-text-light uppercase tracking-widest mb-2">Kullanılan kredi</p>
        <div className="grid grid-cols-4 gap-2">
          {items.map((it) => (
            <div key={it.label} className="rounded-xl border border-border bg-bg px-3 py-2 text-center">
              <p className="text-lg font-semibold text-text">{it.value}</p>
              <p className="text-[11px] text-text-light">{it.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-text-light uppercase tracking-widest mb-2">Kazanılmış kredi geçerliliği</p>
        {stats.grants.length === 0 ? (
          <p className="text-sm text-text-light">Aktif kazanılmış kredi yok.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {stats.grants.map((g, i) => (
              <li key={i} className="flex items-center justify-between text-sm border border-border rounded-xl px-3 py-2">
                <span className="text-text">
                  <b>{g.remaining}</b> kredi
                  <span className="text-text-light ml-1">
                    ({g.source === "order" ? "baskı bonusu" : g.source === "manual" ? "manuel" : g.source})
                  </span>
                </span>
                <span className="text-text-light text-xs">
                  {new Date(g.expiresAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}&apos;e kadar
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
