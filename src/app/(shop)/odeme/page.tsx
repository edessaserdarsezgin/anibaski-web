import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "./CheckoutClient";
import { getShippingSettings } from "@/lib/shipping";
import { getCompanyInfo, sellerForContracts } from "@/lib/company";

export const metadata = { title: "Ödeme", robots: { index: false, follow: false } };

export default async function OdemePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/odeme");

  const [{ data: addresses }, { data: profile }, shippingSettings, company] = await Promise.all([
    supabase.from("addresses").select("*").eq("userId", user.id).order("title", { ascending: true }),
    supabase.from("profiles").select("fullName, phone").eq("id", user.id).single(),
    getShippingSettings(),
    getCompanyInfo(),
  ]);

  if (!profile?.phone) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
          <p className="text-4xl mb-3">📱</p>
          <h1 className="font-serif text-2xl text-text mb-2">Telefon Numarası Gerekli</h1>
          <p className="text-text-light mb-6">
            Sipariş ve kargo bilgilendirmeleri WhatsApp ile gönderildiği için ödeme öncesi profilinize telefon numaranızı eklemeniz gerekiyor.
          </p>
          <Link
            href="/profil?redirect=/odeme"
            className="inline-block px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors"
          >
            Profile Git
          </Link>
        </div>
      </div>
    );
  }

  return <CheckoutClient
    initialAddresses={addresses ?? []}
    shippingFee={shippingSettings.shippingFee}
    freeShippingThreshold={shippingSettings.freeShippingThreshold}
    codFee={shippingSettings.codFee}
    userEmail={user.email ?? ""}
    userFullName={(profile as { fullName?: string | null })?.fullName ?? ""}
    seller={sellerForContracts(company)}
  />;
}
