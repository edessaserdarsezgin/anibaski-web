import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BackButton from "@/components/ui/BackButton";
import ProfileForm from "../ProfileForm";
import PhoneVerification from "../PhoneVerification";

export const metadata = { title: "Bilgilerim", robots: { index: false, follow: false } };

export default async function BilgilerimPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/profil/bilgiler");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="max-w-2xl mx-auto px-8 py-12">
      <BackButton fallback="/profil" className="mb-6" />
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <h1 className="font-serif text-3xl text-text">Bilgilerim</h1>
        <PhoneVerification
          phone={profile?.phone ?? null}
          verified={profile?.phone_verified ?? false}
        />
      </div>
      <div className="bg-white rounded-2xl border border-border p-6">
        <ProfileForm
          email={user.email!}
          fullName={profile?.fullName ?? null}
          phone={profile?.phone ?? null}
          landline={profile?.landline ?? null}
          notifyDeliveryContact={profile?.notify_delivery_contact ?? false}
          marketingConsent={profile?.marketing_consent ?? false}
        />
      </div>
    </div>
  );
}
