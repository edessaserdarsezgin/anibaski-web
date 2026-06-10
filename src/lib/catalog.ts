import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

// 1. Home Categories
export const getHomeCategories = unstable_cache(
  async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("categories")
      .select("id, name, slug")
      .eq("show_on_home", true)
      .order("home_position", { ascending: true });
    return data ?? [];
  },
  ["home-categories"],
  { tags: ["categories"] }
);

// 2. Products by Category IDs (for home rows)
export const getCategoryProductsForHome = unstable_cache(
  async (categoryIds: string[]) => {
    if (categoryIds.length === 0) return [];
    const db = createAdminClient();
    const { data } = await db
      .from("products_with_order_count")
      .select("id, name, slug, basePrice, images, categoryId, discount_percent, discount_starts_at, discount_ends_at, productTags:product_tags(tagId, position, tag:tags(name, color))")
      .in("categoryId", categoryIds)
      .eq("isActive", true)
      .order("createdAt", { ascending: false });
    return data ?? [];
  },
  ["home-category-products"],
  { tags: ["products"] }
);

// 3. Featured Products
export const getFeaturedProducts = unstable_cache(
  async (limit: number = 12) => {
    const db = createAdminClient();
    const { data } = await db
      .from("products_with_order_count")
      .select("id, name, slug, basePrice, images, discount_percent, discount_starts_at, discount_ends_at, productTags:product_tags(tagId, position, tag:tags(name, color))")
      .eq("is_featured", true)
      .eq("isActive", true)
      .order("featured_position", { ascending: true })
      .order("createdAt", { ascending: false })
      .limit(limit);
    return data ?? [];
  },
  ["featured-products"],
  { tags: ["products"] }
);

// 4. Hero Banners
export const getHeroBanners = unstable_cache(
  async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("campaigns")
      .select("id, image_url, title, subtitle, cta_text, cta_url, starts_at, ends_at")
      .eq("show_on_home", true)
      .eq("is_active", true)
      .order("position", { ascending: true });
    return data ?? [];
  },
  ["hero-banners"],
  { tags: ["campaigns"] }
);

// 5. Tags (All tags for filtering)
export const getTags = unstable_cache(
  async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("tags")
      .select("id, name, color")
      .order("name");
    return data ?? [];
  },
  ["catalog-tags"],
  { tags: ["tags"] }
);

// 6. Product Tag Matches (fetch product IDs that match a specific tag)
export const getProductIdsByTag = unstable_cache(
  async (tagId: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("product_tags")
      .select("productId")
      .eq("tagId", tagId);
    return (data as { productId: string }[] | null)?.map((r) => r.productId) ?? [];
  },
  ["product-ids-by-tag"],
  { tags: ["tags", "products"] }
);

// 7. Products List for Catalog (filtered by optional tag product IDs, excluding ready made categories, sorted)
export const getProductsForCatalog = unstable_cache(
  async (column: string, ascending: boolean, tagProductIds: string[] | null, readyMadeIds: string[]) => {
    const db = createAdminClient();
    let baseQuery = db
      .from("products_with_order_count")
      .select("id, name, slug, description, basePrice, images, discount_percent, discount_starts_at, discount_ends_at, category:categories!products_categoryId_fkey(name, slug), productTags:product_tags(tagId, position, tag:tags(name, color))")
      .eq("isActive", true)
      .order(column, { ascending });

    if (readyMadeIds.length > 0) {
      baseQuery = baseQuery.not("categoryId", "in", `(${readyMadeIds.join(",")})`);
    }

    if (tagProductIds !== null) {
      if (tagProductIds.length > 0) {
        baseQuery = baseQuery.in("id", tagProductIds);
      } else {
        return [];
      }
    }

    const { data } = await baseQuery;
    return data ?? [];
  },
  ["catalog-products"],
  { tags: ["products"] }
);

// 8. Category by slug
export const getCategoryBySlug = unstable_cache(
  async (slug: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("categories")
      .select("id, name, slug, description, parentId")
      .eq("slug", slug)
      .single();
    return data;
  },
  ["category-by-slug"],
  { tags: ["categories"] }
);

// 9. Subcategories by parent category ID
export const getSubCategories = unstable_cache(
  async (parentId: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("categories")
      .select("id, name, slug")
      .eq("parentId", parentId)
      .order("name");
    return data ?? [];
  },
  ["subcategories-by-parent"],
  { tags: ["categories"] }
);

// 10. Category by ID (e.g. parent category lookup)
export const getCategoryById = unstable_cache(
  async (id: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("categories")
      .select("id, name, slug")
      .eq("id", id)
      .single();
    return data;
  },
  ["category-by-id"],
  { tags: ["categories"] }
);

// 11. Product categories join rows (for custom category list lookup)
export const getProductCategoriesJoin = unstable_cache(
  async (allCategoryIds: string[]) => {
    if (allCategoryIds.length === 0) return [];
    const db = createAdminClient();
    const { data: pcRows } = await db
      .from("product_categories")
      .select("productId")
      .in("categoryId", allCategoryIds);
    return Array.from(new Set((pcRows ?? []).map((r) => r.productId)));
  },
  ["product-categories-join"],
  { tags: ["categories"] }
);

// 12. Products in Category (with ordering)
export const getProductsInCategory = unstable_cache(
  async (
    allCategoryIds: string[],
    joinProductIds: string[],
    column: string,
    ascending: boolean,
    tagProductIds: string[] | null
  ) => {
    const db = createAdminClient();
    let baseQuery = db
      .from("products_with_order_count")
      .select("id, name, slug, description, basePrice, images, categoryId, discount_percent, discount_starts_at, discount_ends_at, productTags:product_tags(tagId, position, tag:tags(name, color))")
      .eq("isActive", true)
      .order(column, { ascending });

    if (joinProductIds.length > 0) {
      baseQuery = baseQuery.or(`categoryId.in.(${allCategoryIds.join(",")}),id.in.(${joinProductIds.join(",")})`);
    } else {
      baseQuery = baseQuery.in("categoryId", allCategoryIds);
    }

    if (tagProductIds !== null) {
      if (tagProductIds.length > 0) {
        baseQuery = baseQuery.in("id", tagProductIds);
      } else {
        return [];
      }
    }

    const { data } = await baseQuery;
    return data ?? [];
  },
  ["products-in-category"],
  { tags: ["products"] }
);

// 13. Product by slug (for product details page)
export const getProductBySlug = unstable_cache(
  async (slug: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("products")
      .select("*, category:categories!products_categoryId_fkey(id, name, slug), productTags:product_tags(tagId, position, tag:tags(name, color))")
      .eq("slug", slug)
      .eq("isActive", true)
      .single();
    return data;
  },
  ["product-by-slug"],
  { tags: ["products"] }
);

// 14. Product variants
export const getProductVariants = unstable_cache(
  async (productId: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("product_variants")
      .select("id, type, label, value, priceAddon")
      .eq("productId", productId)
      .order("type");
    return data ?? [];
  },
  ["product-variants"],
  { tags: ["products"] }
);

// 15. Related products (same category)
export const getRelatedProductsSameCategory = unstable_cache(
  async (categoryId: string, productId: string) => {
    const db = createAdminClient();
    const RELATED_COLS = "id, name, slug, basePrice, images, discount_percent, discount_starts_at, discount_ends_at, productTags:product_tags(tagId, position, tag:tags(name, color))";
    const { data } = await db
      .from("products_with_order_count")
      .select(RELATED_COLS)
      .eq("categoryId", categoryId)
      .eq("isActive", true)
      .neq("id", productId)
      .limit(24);
    return data ?? [];
  },
  ["related-products-same-category"],
  { tags: ["products"] }
);

// 16. Related products fallback (featured/newest)
export const getRelatedProductsFallback = unstable_cache(
  async (productId: string) => {
    const db = createAdminClient();
    const RELATED_COLS = "id, name, slug, basePrice, images, discount_percent, discount_starts_at, discount_ends_at, productTags:product_tags(tagId, position, tag:tags(name, color))";
    const { data } = await db
      .from("products_with_order_count")
      .select(RELATED_COLS)
      .eq("isActive", true)
      .neq("id", productId)
      .order("is_featured", { ascending: false })
      .order("createdAt", { ascending: false })
      .limit(16);
    return data ?? [];
  },
  ["related-products-fallback"],
  { tags: ["products"] }
);
