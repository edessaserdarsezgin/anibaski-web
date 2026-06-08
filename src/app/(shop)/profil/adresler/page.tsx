import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BackButton from "@/components/ui/BackButton";
import AddressBook from "../AddressBook";

export const metadata = { title: "Adreslerim", robots: { index: false, follow: false } };

export default async function AdreslerimPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/profil/adresler");

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("userId", user.id)
    .order("title", { ascending: true });

  return (
    <div className="max-w-2xl mx-auto px-8 py-12">
      <BackButton fallback="/profil" className="mb-6" />
      <h1 className="font-serif text-3xl text-text mb-6">Adreslerim</h1>
      <div className="bg-white rounded-2xl border border-border p-6">
        <AddressBook initial={addresses ?? []} />
      </div>
    </div>
  );
}
