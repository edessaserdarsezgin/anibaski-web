import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { withItemPromotions } from "@/lib/catalog";

// ProductCard'ın beklediği alanlar — catalog.ts'teki listelerle aynı.
const PRODUCT_CARD_SELECT =
  "id, name, slug, basePrice, images, categoryId, discount_percent, discount_starts_at, discount_ends_at, productTags:product_tags(tagId, position, tag:tags(name, color, text_color, is_active))";

export type CollectionDetail = {
  id: string; name: string; slug: string; description: string | null;
  hero_image: string | null; theme_color: string | null;
  cta_label: string | null; cta_href: string | null;
  metaTitle: string | null; metaDescription: string | null;
};

// 1. Aktif koleksiyonlar — /koleksiyonlar dizin sayfası
export const getActiveCollections = unstable_cache(
  async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("collections")
      .select("id, name, slug, description, hero_image, theme_color, collection_products(count)")
      .eq("is_active", true)
      .order("sort_order");
    return (data ?? []).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      slug: c.slug as string,
      description: (c.description as string | null) ?? null,
      hero_image: (c.hero_image as string | null) ?? null,
      theme_color: (c.theme_color as string | null) ?? null,
      productCount: (c.collection_products as unknown as { count: number }[])?.[0]?.count ?? 0,
    }));
  },
  ["collections-active"],
  { tags: ["collections"] }
);

// 2. Slug ile koleksiyon — /koleksiyonlar/[slug] (pasifse null → sayfa 404)
export const getCollectionBySlug = unstable_cache(
  async (slug: string): Promise<CollectionDetail | null> => {
    const db = createAdminClient();
    const { data } = await db
      .from("collections")
      .select("id, name, slug, description, hero_image, theme_color, cta_label, cta_href, metaTitle, metaDescription")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    return (data as CollectionDetail | null) ?? null;
  },
  ["collection-by-slug"],
  { tags: ["collections"] }
);

// 3. Koleksiyon ürünleri — position sıralı, yalnız aktif ürünler, indirim hesaplı
export const getCollectionProducts = unstable_cache(
  async (collectionId: string) => {
    const db = createAdminClient();
    const { data: joins } = await db
      .from("collection_products")
      .select("product_id, position")
      .eq("collection_id", collectionId)
      .order("position");
    const ids = (joins ?? []).map((j) => j.product_id as string);
    if (!ids.length) return [];
    const { data: prods } = await db
      .from("products_with_order_count")
      .select(PRODUCT_CARD_SELECT)
      .in("id", ids)
      .eq("isActive", true);
    const priced = await withItemPromotions(prods ?? []);
    const byId = new Map(priced.map((p) => [p.id as string, p]));
    return ids.map((id) => byId.get(id)).filter(Boolean) as typeof priced;
  },
  ["collection-products"],
  { tags: ["collections", "products", "promotions"] }
);

// 4. Ana sayfa koleksiyon şeritleri — show_on_home, koleksiyon başına ilk 8 ürün
export const getHomeCollections = unstable_cache(
  async () => {
    const db = createAdminClient();
    const { data: cols } = await db
      .from("collections")
      .select("id, name, slug")
      .eq("is_active", true)
      .eq("show_on_home", true)
      .order("sort_order");
    if (!cols?.length) return [];
    const colIds = cols.map((c) => c.id as string);
    const { data: joins } = await db
      .from("collection_products")
      .select("collection_id, product_id, position")
      .in("collection_id", colIds)
      .order("position");
    const pids = [...new Set((joins ?? []).map((j) => j.product_id as string))];
    if (!pids.length) return [];
    const { data: prods } = await db
      .from("products_with_order_count")
      .select(PRODUCT_CARD_SELECT)
      .in("id", pids)
      .eq("isActive", true);
    const priced = await withItemPromotions(prods ?? []);
    const byId = new Map(priced.map((p) => [p.id as string, p]));
    return cols
      .map((c) => ({
        id: c.id as string,
        name: c.name as string,
        slug: c.slug as string,
        products: (joins ?? [])
          .filter((j) => j.collection_id === c.id)
          .map((j) => byId.get(j.product_id as string))
          .filter(Boolean)
          .slice(0, 8),
      }))
      .filter((r) => r.products.length > 0);
  },
  ["collections-home"],
  { tags: ["collections", "products", "promotions"] }
);
