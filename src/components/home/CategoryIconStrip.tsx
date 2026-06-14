import Link from "next/link";
import Image from "next/image";

type Cat = { id: string; name: string; slug: string; imageUrl?: string | null };

export default function CategoryIconStrip({ categories }: { categories: Cat[] }) {
  if (!categories.length) return null;
  return (
    <section className="py-8 px-4 sm:px-8 bg-bg border-b border-border">
      <div className="max-w-7xl mx-auto">
        <ul className="no-scrollbar flex gap-5 sm:gap-8 overflow-x-auto snap-x scroll-px-4 -mx-4 px-4 justify-start sm:justify-center">
          {categories.map((c) => (
            <li key={c.id} className="snap-start shrink-0">
              <Link
                href={`/kategoriler/${c.slug}`}
                className="group flex flex-col items-center gap-2 w-20 text-center"
              >
                <span className="relative w-16 h-16 rounded-full overflow-hidden border border-border bg-white shadow-soft flex items-center justify-center group-hover:border-primary/40 group-hover:scale-105 transition-all duration-300">
                  {c.imageUrl ? (
                    <Image src={c.imageUrl} alt={c.name} fill sizes="64px" className="object-cover" />
                  ) : (
                    <span className="font-serif text-xl text-primary">{c.name.charAt(0)}</span>
                  )}
                </span>
                <span className="text-xs font-medium text-text leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {c.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
