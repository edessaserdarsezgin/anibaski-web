import Link from "next/link";
import type { CampaignTile } from "@/lib/catalog";

export default function CampaignTiles({ tiles }: { tiles: CampaignTile[] }) {
  if (!tiles.length) return null;
  return (
    <section className="py-16 px-4 sm:px-8 bg-white border-y border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-2">Fırsatlar</p>
          <h2 className="font-serif text-3xl md:text-4xl text-text">Kampanyalar</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className="group relative overflow-hidden rounded-3xl p-6 min-h-[150px] flex flex-col justify-between hover:-translate-y-1 hover:shadow-hover transition-all duration-300"
              style={{ backgroundColor: `${t.color}1a`, border: `1px solid ${t.color}40` }}
            >
              <span className="font-serif text-3xl font-semibold" style={{ color: t.color }}>{t.label}</span>
              <div>
                <p className="text-sm font-semibold text-text line-clamp-2">{t.title}</p>
                {t.code && (
                  <span className="inline-block mt-2 text-[11px] font-mono font-semibold px-2 py-0.5 rounded border border-dashed" style={{ color: t.color, borderColor: `${t.color}80` }}>
                    {t.code}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
