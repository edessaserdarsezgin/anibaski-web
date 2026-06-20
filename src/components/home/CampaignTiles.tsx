import Link from "next/link";
import Image from "next/image";
import type { CampaignCard } from "@/lib/catalog";

export default function CampaignTiles({ cards }: { cards: CampaignCard[] }) {
  if (!cards.length) return null;
  return (
    <section className="py-16 px-4 sm:px-8 bg-white border-y border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-2">Fırsatlar</p>
          <h2 className="font-serif text-3xl md:text-4xl text-text">Kampanyalar</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Link
              key={c.id}
              href={c.cta_url}
              className="group relative overflow-hidden rounded-3xl aspect-[4/3] flex flex-col justify-end p-5 hover:-translate-y-1 hover:shadow-hover transition-all duration-300"
            >
              <Image
                src={c.image_url}
                alt={c.title}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-text/75 via-text/25 to-transparent" />
              <div className="relative">
                {c.coupon_code && (
                  <span className="inline-block mb-2 text-[11px] font-mono font-semibold px-2 py-0.5 rounded border border-dashed border-white/60 text-white">
                    {c.coupon_code}
                  </span>
                )}
                <h3 className="font-serif text-lg md:text-xl text-white leading-tight">{c.title}</h3>
                {c.subtitle && <p className="text-xs text-white/80 mt-1 line-clamp-2">{c.subtitle}</p>}
                {c.cta_text && (
                  <span className="inline-flex items-center gap-1.5 mt-3 text-white text-xs font-semibold group-hover:gap-2.5 transition-all">
                    {c.cta_text} <span aria-hidden>→</span>
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
