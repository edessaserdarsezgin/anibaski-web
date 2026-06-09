// Admin yetki kontrolü — tek kaynak. Önceden her admin route'unda kopyalanan
// requireAdmin/isAdmin yardımcıları buraya taşındı (tek davranış, tek değişiklik noktası).
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Giriş yapmış ve role === "ADMIN" ise { user, supabase } döner (supabase = admin client,
 * RLS bypass). Aksi halde null. Kullanım:
 *   const guard = await requireAdmin();
 *   if (!guard) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 *   guard.supabase.from(...)   // admin client
 *   guard.user.id              // doğrulanmış kullanıcı
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return null;
  return { user, supabase: createAdminClient() };
}
