import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import CampaignForm from "../CampaignForm";

export const metadata = { title: "Yeni Kampanya | Admin" };

export default async function YeniKampanyaPage() {
  const supabase = createAdminClient();
  const [{ data: categories }, { data: products }, { data: coupons }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase.from("products").select("id, name, slug").eq("isActive", true).order("name"),
    supabase.from("coupons").select("id, code").eq("is_active", true).order("code"),
  ]);

  return (
    <div>
      <div className="mb-6 text-sm">
        <Link href="/admin/kampanyalar" className="text-text-light hover:text-primary">
          ← Kampanyalar
        </Link>
      </div>
      <h1 className="font-serif text-3xl text-text mb-8">Yeni Kampanya</h1>

      <CampaignForm categories={categories ?? []} products={products ?? []} coupons={coupons ?? []} />
    </div>
  );
}
