import Link from "next/link";
import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import CampaignToggle from "./CampaignToggle";
import CampaignDelete from "./CampaignDelete";
import CampaignHomeToggle from "./CampaignHomeToggle";

export const metadata = { title: "Kampanyalar | Admin" };

type Campaign = {
  id: string;
  title: string;
  slug: string;
  image_url: string;
  cta_url: string;
  coupon_code: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  show_on_home: boolean;
  position: number;
};

export default async function AdminKampanyalarPage() {
  noStore();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  const campaigns: Campaign[] = (data ?? []) as Campaign[];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-text">Kampanyalar</h1>
        <Link
          href="/admin/kampanyalar/yeni"
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-full transition-colors"
        >
          + Yeni Kampanya
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {!campaigns.length ? (
          <p className="text-sm text-text-light p-6">Henüz kampanya yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-bg">
              <tr className="text-text-light">
                <th className="text-left px-6 py-3 font-semibold">Kampanya</th>
                <th className="text-left px-4 py-3 font-semibold">Kupon</th>
                <th className="text-left px-4 py-3 font-semibold">Tarih</th>
                <th className="text-center px-4 py-3 font-semibold">Sıra</th>
                <th className="text-center px-4 py-3 font-semibold">Ana Sayfa</th>
                <th className="text-center px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-lg bg-bg border border-border overflow-hidden shrink-0">
                        <Image src={c.image_url} alt={c.title} fill className="object-cover" sizes="56px" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text truncate">{c.title}</p>
                        <p className="text-xs text-text-light font-mono truncate">{c.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-mono text-primary">{c.coupon_code ?? "—"}</td>
                  <td className="px-4 py-4 text-xs text-text-light">
                    {c.starts_at && <p>Başlangıç: {new Date(c.starts_at).toLocaleDateString("tr-TR")}</p>}
                    {c.ends_at && <p>Bitiş: {new Date(c.ends_at).toLocaleDateString("tr-TR")}</p>}
                    {!c.starts_at && !c.ends_at && <p>Süresiz</p>}
                  </td>
                  <td className="px-4 py-4 text-center text-text-light">{c.position}</td>
                  <td className="px-4 py-4 text-center">
                    <CampaignHomeToggle id={c.id} on={c.show_on_home} />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <CampaignToggle id={c.id} active={c.is_active} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-3 justify-end">
                      <Link
                        href={`/admin/kampanyalar/${c.id}/duzenle`}
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        Düzenle
                      </Link>
                      <CampaignDelete id={c.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
