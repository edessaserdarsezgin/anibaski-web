import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendAccountDeletionRequest } from "@/lib/email/accountDeletion";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminDb = createAdminClient();
  const { data: profile } = await adminDb
    .from("profiles")
    .select('"fullName"')
    .eq("id", user.id)
    .single();

  await sendAccountDeletionRequest({
    userId: user.id,
    userEmail: user.email ?? "",
    userName: profile?.fullName ?? null,
  }).catch((err) => console.error("[delete-request] mail hatası:", err));

  return NextResponse.json({ ok: true });
}
