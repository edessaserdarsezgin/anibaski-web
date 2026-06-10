import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export const READY_MADE_SLUG = "hazir-urunler";

// Hazır Ürünler kategorisi + alt kategorilerinin id'leri (kategori yoksa boş dizi)
export const getReadyMadeCategoryIds = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const db = createAdminClient();
      const { data: cat } = await db
        .from("categories").select("id").eq("slug", READY_MADE_SLUG).maybeSingle();
      if (!cat) return [];
      const { data: children } = await db
        .from("categories").select("id").eq("parentId", cat.id);
      return [cat.id, ...(children ?? []).map((c: { id: string }) => c.id)];
    } catch {
      return [];
    }
  },
  ["ready-made-category-ids"],
  { tags: ["categories"] }
);
