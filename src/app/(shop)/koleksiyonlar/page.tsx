import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { getActiveCollections } from "@/lib/collections";

export async function generateMetadata() {
  return pageMetadata("/koleksiyonlar");
}

export default async function KoleksiyonlarPage() {
  const collections = await getActiveCollections();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <header className="mb-10">
        <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-2">Seçkiler</p>
        <h1 className="font-serif text-4xl md:text-5xl text-text">Koleksiyonlar</h1>
        <p className="mt-3 text-text-light max-w-xl">Temalara göre özenle derlediğimiz ürün seçkileri.</p>
      </header>

      {!collections.length ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <p className="font-serif text-2xl text-text">Henüz koleksiyon bulunmuyor</p>
          <p className="text-text-light text-sm">Yakında yeni koleksiyonlar eklenecek.</p>
          <Link href="/urunler" className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-full text-sm font-semibold transition-colors">
            Tüm Ürünler
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/koleksiyonlar/${c.slug}`}
              className="group relative overflow-hidden rounded-3xl border border-border min-h-[220px] flex flex-col justify-end p-7 hover:shadow-hover transition-all duration-300 hover:-translate-y-1"
            >
              {c.hero_image ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.hero_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-text/70 via-text/20 to-transparent" />
                </>
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: c.theme_color ? `${c.theme_color}1a` : "#fdfbf7" }}
                />
              )}
              <div className="relative">
                <h2 className={`font-serif text-2xl mb-1 ${c.hero_image ? "text-white" : "text-text group-hover:text-primary transition-colors"}`}>
                  {c.name}
                </h2>
                {c.description && (
                  <p className={`text-sm line-clamp-2 ${c.hero_image ? "text-white/75" : "text-text-light"}`}>{c.description}</p>
                )}
                <p className={`mt-2 text-xs font-semibold ${c.hero_image ? "text-white/70" : "text-text-light"}`}>{c.productCount} ürün</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
