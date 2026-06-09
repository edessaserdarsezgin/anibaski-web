import Link from "next/link";

/** Şirin boş-durum — yumuşak illüstrasyon + sparkle + samimi metin + CTA. */
export default function EmptyState({
  icon,
  title,
  subtitle,
  ctaHref,
  ctaLabel,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
      <div className="relative mb-7">
        {/* sparkle dekorlar */}
        <span className="absolute -top-3 -left-4 text-accent text-lg select-none">✦</span>
        <span className="absolute top-0 -right-5 text-primary/50 text-sm select-none">✦</span>
        <span className="absolute -bottom-1 -left-6 w-1.5 h-1.5 rounded-full bg-primary/40" />
        <span className="absolute bottom-3 -right-7 text-accent text-base select-none">✦</span>
        <span className="absolute -top-5 right-7 w-1.5 h-1.5 rounded-full bg-accent/70" />
        <div className="w-28 h-28 rounded-full bg-primary/8 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      <h2 className="font-serif text-2xl text-text mb-2">{title}</h2>
      <p className="text-text-light text-sm max-w-xs mb-7 leading-relaxed">{subtitle}</p>
      <Link
        href={ctaHref}
        className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full shadow-soft transition-all hover:-translate-y-0.5"
      >
        {ctaLabel}
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
