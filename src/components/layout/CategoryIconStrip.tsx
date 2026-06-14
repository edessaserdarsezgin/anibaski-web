import Link from "next/link";
import Image from "next/image";

type Cat = { id: string; name: string; slug: string; imageUrl?: string | null };

/**
 * Site geneli yuvarlak kategori ikon şeridi — header'ın hemen altında, tüm
 * (shop) sayfalarında. Sticky DEĞİL (normal akışta kayar; üçüncü sabit bar
 * mobil alanı yemesin diye — bkz. SORUNLAR sticky kararı).
 */
export default function CategoryIconStrip({ categories }: { categories: Cat[] }) {
  if (!categories.length) return null;
  return (
    <nav aria-label="Kategoriler" className="bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <ul className="no-scrollbar flex gap-4 sm:gap-6 overflow-x-auto py-4">
          {categories.map((c) => (
            <li key={c.id} className="shrink-0">
              <Link
                href={`/kategoriler/${c.slug}`}
                className="group flex flex-col items-center gap-2 w-[76px] text-center"
              >
                <span className="w-[68px] h-[68px] rounded-full p-[3px] bg-gradient-to-br from-primary/50 to-accent/60 group-hover:from-primary group-hover:to-accent transition-all duration-300 group-hover:scale-105">
                  <span className="relative block w-full h-full rounded-full overflow-hidden bg-white">
                    {c.imageUrl ? (
                      <Image src={c.imageUrl} alt={c.name} fill sizes="68px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center font-serif text-2xl text-primary">
                        {c.name.charAt(0)}
                      </span>
                    )}
                  </span>
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-text leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {c.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
