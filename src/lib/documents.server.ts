import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { mergeMakbuzConfig, type MakbuzConfig } from "@/lib/documents";

/** Belge config'ini DB'den yükler (yoksa varsayılan). Yalnızca server. */
export async function getMakbuzConfig(): Promise<MakbuzConfig> {
  const db = createAdminClient();
  const { data } = await db.from("document_settings").select("config").eq("type", "makbuz").maybeSingle();
  return mergeMakbuzConfig(data?.config);
}
