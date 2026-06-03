// AI Stüdyo araçları — admin'den yönetilir (studio_tools tablosu). Galeri ve edit
// route'u buradan okur; yeni efekt eklemek = admin formundan satır eklemek (kod deploy yok).
import { createAdminClient } from "@/lib/supabase/server";

export type StudioToolRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  engine: "upscale" | "edit" | null;
  lora: string | null;
  prompt: string | null;
  generative: boolean;
  active: boolean;
  sortOrder: number;
};

type DbRow = {
  id: string; slug: string; name: string; description: string; icon: string;
  engine: string | null; lora: string | null; prompt: string | null;
  generative: boolean; active: boolean; sort_order: number;
};

function mapRow(r: DbRow): StudioToolRow {
  return {
    id: r.id, slug: r.slug, name: r.name, description: r.description, icon: r.icon,
    engine: (r.engine as StudioToolRow["engine"]) ?? null,
    lora: r.lora, prompt: r.prompt,
    generative: r.generative, active: r.active, sortOrder: r.sort_order,
  };
}

/** Tüm araçlar, sıralı. Galeri pasifleri "Yakında" olarak gösterir, admin hepsini yönetir. */
export async function getStudioTools(): Promise<StudioToolRow[]> {
  const db = createAdminClient();
  const { data } = await db.from("studio_tools").select("*").order("sort_order", { ascending: true });
  return (data ?? []).map((r) => mapRow(r as DbRow));
}

/** Tek araç (edit route'unda LoRA+prompt çözümü için). */
export async function getStudioTool(slug: string): Promise<StudioToolRow | null> {
  const db = createAdminClient();
  const { data } = await db.from("studio_tools").select("*").eq("slug", slug).single();
  return data ? mapRow(data as DbRow) : null;
}
