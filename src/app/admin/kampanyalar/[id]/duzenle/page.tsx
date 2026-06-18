import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import CampaignForm from "../../CampaignForm";

export const metadata = { title: "Kampanya Düzenle | Admin" };

type Props = { params: Promise<{ id: string }> };

function toDatetimeLocal(s: string | null): string {
  if (!s) return "";
  const d = new Date(s);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function KampanyaDuzenlePage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: campaign }, { data: categories }, { data: products }, { data: coupons }] = await Promise.all([
    supabase.from("campaigns").select("*").eq("id", id).single(),
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase.from("products").select("id, name, slug").eq("isActive", true).order("name"),
    supabase.from("promotions").select("id, code").eq("trigger", "code").eq("is_active", true).order("code"),
  ]);

  if (!campaign) notFound();

  const initial = {
    id: campaign.id as string,
    title: campaign.title ?? "",
    slug: campaign.slug ?? "",
    subtitle: campaign.subtitle ?? "",
    description: campaign.description ?? "",
    image_url: campaign.image_url ?? "",
    cta_text: campaign.cta_text ?? "İncele",
    cta_url: campaign.cta_url ?? "",
    coupon_code: campaign.coupon_code ?? "",
    starts_at: toDatetimeLocal(campaign.starts_at),
    ends_at: toDatetimeLocal(campaign.ends_at),
    position: campaign.position ?? 0,
    placement: (campaign.placement as string) ?? "hero",
    show_on_home: (campaign.show_on_home as boolean) ?? false,
  };

  return (
    <div>
      <div className="mb-6 text-sm">
        <Link href="/admin/kampanyalar" className="text-text-light hover:text-primary">
          ← Kampanyalar
        </Link>
      </div>
      <h1 className="font-serif text-3xl text-text mb-8">Kampanya Düzenle</h1>

      <CampaignForm initial={initial} categories={categories ?? []} products={products ?? []} coupons={coupons ?? []} />
    </div>
  );
}
