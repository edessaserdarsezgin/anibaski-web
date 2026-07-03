import Link from "next/link";

type Crumb = { name: string; href: string };

type CategoryHeroProps = {
  category: {
    name: string;
    slug: string;
    description: string | null;
    hero_image: string | null;
    theme_color: string | null;
    cta_label: string | null;
    cta_href: string | null;
  };
  parentCategory: { name: string; slug: string } | null;
  productCount: number;
  /** Breadcrumb orta kısmı; verilmezse varsayılan: Ürünler + üst kategori. */
  crumbs?: Crumb[];
};

export default function CategoryHero({ category, parentCategory, productCount, crumbs }: CategoryHeroProps) {
  const hasImage = !!category.hero_image;
  const theme = category.theme_color?.trim() || null;
  const showCta = !!(category.cta_label?.trim() && category.cta_href?.trim());
  const onDark = hasImage; // görsel varsa metin açık renk

  const middle: Crumb[] = crumbs ?? [
    { name: "Ürünler", href: "/urunler" },
    ...(parentCategory ? [{ name: parentCategory.name, href: `/kategoriler/${parentCategory.slug}` }] : []),
  ];

  const t = {
    crumb: onDark ? "text-white/70" : "text-text-light",
    link: onDark ? "hover:text-white transition-colors" : "hover:text-primary transition-colors",
    sep: onDark ? "text-white/40" : "text-border",
    current: onDark ? "text-white" : "text-text",
    eyebrow: onDark ? "text-white/80" : "text-primary",
    title: onDark ? "text-white" : "text-text",
    desc: onDark ? "text-white/85" : "text-text-light",
    count: onDark ? "text-white/70" : "text-text-light",
  };

  return (
    <section className="relative bg-bg border-b border-border overflow-hidden">
      {/* C durumu: banner görsel + okunurluk scrim'i */}
      {hasImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={category.hero_image!} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background: theme
                ? `linear-gradient(90deg, ${theme}e6 0%, ${theme}99 55%, ${theme}33 100%)`
                : "linear-gradient(90deg, rgba(61,64,91,0.88) 0%, rgba(61,64,91,0.6) 55%, rgba(61,64,91,0.2) 100%)",
            }}
          />
        </>
      )}

      {/* A/B durumu: dekoratif bloblar (görsel yokken) */}
      {!hasImage && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl ${theme ? "" : "bg-primary/8"}`}
            style={theme ? { backgroundColor: theme, opacity: 0.1 } : undefined}
          />
          <div
            className={`absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl ${theme ? "" : "bg-accent/15"}`}
            style={theme ? { backgroundColor: theme, opacity: 0.18 } : undefined}
          />
        </div>
      )}

      <div className={`relative max-w-7xl mx-auto px-8 py-14 ${hasImage ? "min-h-[300px] flex flex-col justify-end" : ""}`}>
        <p className={`text-sm ${t.crumb} flex items-center gap-1.5 mb-6 flex-wrap`}>
          <Link href="/" className={t.link}>Ana Sayfa</Link>
          {middle.map((c) => (
            <span key={c.href} className="flex items-center gap-1.5">
              <span className={t.sep}>/</span>
              <Link href={c.href} className={t.link}>{c.name}</Link>
            </span>
          ))}
          <span className={t.sep}>/</span>
          <span className={t.current}>{category.name}</span>
        </p>
        <p className={`text-xs font-semibold tracking-[0.25em] uppercase mb-3 ${t.eyebrow}`}>Koleksiyon</p>
        <h1 className={`font-serif text-5xl md:text-6xl leading-tight ${t.title}`}>{category.name}</h1>
        {category.description && (
          <p className={`mt-3 text-lg max-w-xl ${t.desc}`}>{category.description}</p>
        )}
        <p className={`mt-3 text-sm ${t.count}`}>{productCount} ürün · Türkiye geneli kargo</p>
        {showCta && (
          <Link
            href={category.cta_href!}
            className="mt-5 inline-flex w-fit items-center gap-2 px-7 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-all hover:-translate-y-0.5"
          >
            {category.cta_label}
          </Link>
        )}
      </div>
    </section>
  );
}
