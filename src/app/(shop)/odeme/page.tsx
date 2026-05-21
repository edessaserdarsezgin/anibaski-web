import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "./CheckoutClient";

export const metadata = { title: "Ödeme", robots: { index: false, follow: false } };

export default async function OdemePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/odeme");

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("userId", user.id)
    .order("title", { ascending: true });

  return <CheckoutClient initialAddresses={addresses ?? []} />;
}
