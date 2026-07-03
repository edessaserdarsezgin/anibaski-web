import { createAdminClient } from "@/lib/supabase/server";

type Entity = "product" | "category";
type DB = ReturnType<typeof createAdminClient>;

const TABLE: Record<Entity, string> = { product: "products", category: "categories" };

/**
 * Slug değiştiğinde eski slug'ı kaydeder (eski URL → yeni URL yönlendirmesi için).
 * Yeni slug daha önce bir eski-kayıtsa (revert) o satır silinir → yönlendirme döngüsü önlenir.
 */
export async function recordSlugChange(db: DB, entity: Entity, entityId: string, oldSlug: string, newSlug: string) {
  if (!oldSlug || oldSlug === newSlug) return;
  await db.from("slug_history").delete().eq("entity_type", entity).eq("old_slug", newSlug);
  await db.from("slug_history").upsert(
    { entity_type: entity, entity_id: entityId, old_slug: oldSlug },
    { onConflict: "entity_type,old_slug" },
  );
}

/**
 * Eski slug için güncel slug'ı döndürür (yoksa null). Canlı kayıt bulunamayınca çağrılır.
 */
export async function resolveSlugRedirect(entity: Entity, oldSlug: string): Promise<string | null> {
  const db = createAdminClient();
  const { data: hist } = await db
    .from("slug_history")
    .select("entity_id")
    .eq("entity_type", entity)
    .eq("old_slug", oldSlug)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!hist) return null;
  const { data: row } = await db
    .from(TABLE[entity])
    .select("slug")
    .eq("id", hist.entity_id)
    .maybeSingle();
  const slug = row?.slug as string | undefined;
  if (!slug || slug === oldSlug) return null;
  return slug;
}
