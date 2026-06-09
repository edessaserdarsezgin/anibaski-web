import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCreditStatus } from "@/lib/studioCredits";

// Header rozeti + /studyo yalnız kredi DURUMUNU kullanır (total/dailyFree/earned/trial).
// İstatistik (gün/hafta/ay) profil sayfasında sunucuda ayrıca çekilir → burada hesaplanmaz.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  return NextResponse.json(await getCreditStatus(user.id));
}
