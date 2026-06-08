import Link from "next/link";
import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Kampanyalar",
  description: "AnıBaskı'nın güncel kampanyaları, indirim fırsatları ve özel teklifleri.",
};

type Campaign = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  cta_text: string;
  cta_url: string;
  coupon_code: string | null;
  ends_at: string | null;
};

function isEndingSoon(endsAt: string | null): boolean {
  if (!endsAt) return false;
  const ms = new Date(endsAt).getTime() - Date.now();
  return ms > 0 && ms < 1000 * 60 * 60 * 72;
}

export default async function KampanyalarPage() {
  noStore();
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("position", { ascending: true });

  const campaigns: Campaign[] = (data ?? []) as Campaign[];

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="font-serif text-3xl md:text-4xl text-text mb-3">Kampanyalar</h1>
        <p className="text-text-light max-w-xl mx-auto">
          Güncel fırsatları kaçırmayın — özel indirimler ve kuponlarımız sizi bekliyor.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">🎁</p>
          <h2 className="font-serif text-xl text-text mb-2">Şu an aktif kampanya yok</h2>
          <p className="text-text-light mb-6">Yakında yeni fırsatlarla tekrar görüşmek üzere!</p>
          <Link
            href="/urunler"
            className="inline-block px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors"
          >
            Ürünleri Keşfet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={c.cta_url}
              className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-hover hover:border-primary transition-all flex flex-col"
            >
              <div className="relative aspect-[16/10] bg-bg">
                <Image
                  src={c.image_url}
                  alt={c.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {isEndingSoon(c.ends_at) && (
                  <span className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                    Son 3 gün
                  </span>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h2 className="font-serif text-xl text-text mb-1">{c.title}</h2>
                {c.subtitle && <p className="text-sm text-primary font-semibold mb-2">{c.subtitle}</p>}
                {c.description && <p className="text-sm text-text-light mb-4 flex-1">{c.description}</p>}

                <div className="flex items-center justify-between gap-3 mt-auto">
                  {c.coupon_code && (
                    <div className="px-3 py-1.5 border border-dashed border-primary rounded-lg">
                      <p className="text-xs text-text-light">Kod</p>
                      <p className="text-sm font-mono font-bold text-primary">{c.coupon_code}</p>
                    </div>
                  )}
                  <span className="ml-auto px-5 py-2 bg-primary group-hover:bg-primary-hover text-white text-sm font-semibold rounded-full transition-colors">
                    {c.cta_text}
                  </span>
                </div>

                {c.ends_at && (
                  <p className="text-xs text-text-light mt-3">
                    Son tarih:{" "}
                    {new Date(c.ends_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
