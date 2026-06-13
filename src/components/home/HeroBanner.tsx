import Link from "next/link";
import Image from "next/image";

type Banner = { id: string; image_url: string; title: string; subtitle: string | null; cta_text: string | null; cta_url: string };

export default function HeroBanner({ banners }: { banners: Banner[] }) {
  if (!banners.length) return null;
  return (
    <section className="px-4 pt-4">
      <div className="max-w-7xl mx-auto flex gap-4 overflow-x-auto snap-x snap-mandatory rounded-3xl scrollbar-none">
        {banners.map((b) => (
          <Link key={b.id} href={b.cta_url}
            className="group relative shrink-0 w-full snap-center aspect-[21/9] rounded-3xl overflow-hidden bg-bg">
            <Image src={b.image_url} alt={b.title} fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-text/65 via-text/25 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-14 max-w-xl">
              <h2 className="font-serif text-3xl md:text-5xl text-white mb-2 leading-tight">{b.title}</h2>
              {b.subtitle && <p className="text-white/85 text-sm md:text-lg mb-5">{b.subtitle}</p>}
              <span className="inline-flex self-start items-center gap-2 px-6 py-3 bg-white text-text font-semibold rounded-full text-sm group-hover:gap-3 transition-all">
                {b.cta_text || "İncele"} <span aria-hidden>→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
