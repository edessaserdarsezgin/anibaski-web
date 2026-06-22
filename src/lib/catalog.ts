import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getActiveItemPromotions, getActiveCouponPromotions } from "@/lib/promotions";
import { bestItemDiscount, itemInScope, isDateValid } from "@/lib/promotionsCalc";
import { activeDiscountPercent } from "@/lib/pricing";

type DiscountableRow = {
  id: string; basePrice: number; categoryId?: string | null;
  discount_percent?: number | null; discount_starts_at?: string | null; discount_ends_at?: string | null;
  salePrice?: number | null;
};

/**
 * Ürün-seviyesi indirimi (products.discount_percent) kategori/tüm otomatik promotion'larla
 * birleştirir; daha büyüğünü efektif `discount_percent` olarak yazar (PriceTag değişmeden gösterir).
 * Item-promotion yoksa satırlar aynen döner (ürün-own indirim korunur).
 */
async function withItemPromotions<T extends DiscountableRow>(rows: T[]): Promise<T[]> {
  if (!rows.length) return rows;
  const [promos, coupons] = await Promise.all([getActiveItemPromotions(), getActiveCouponPromotions()]);
  const scopedCoupons = coupons.filter((c) => c.scope !== "all" && isDateValid(c) && c.code);
  if (!promos.length && !scopedCoupons.length) return rows;
  return rows.map((r) => {
    const base = Number(r.basePrice);
    const ownPct = activeDiscountPercent({
      discount_percent: r.discount_percent ?? null,
      discount_starts_at: r.discount_starts_at ?? null,
      discount_ends_at: r.discount_ends_at ?? null,
    });
    const { unitPrice } = bestItemDiscount({ productId: r.id, categoryId: r.categoryId ?? null, unitPrice: base }, promos);
    const promoPct = base > 0 && unitPrice < base ? Math.round((1 - unitPrice / base) * 100) : 0;
    const pct = Math.max(ownPct, promoPct);
    // Sabit tutarlı promosyon varsa (promoPct > ownPct) kesin hesaplanan fiyatı sakla;
    // yüzde→fiyat çift yuvarlama hatasını önler.
    const salePrice = pct > 0 ? (promoPct > ownPct ? unitPrice : null) : null;
    const cb = scopedCoupons.find((c) => itemInScope(c, { productId: r.id, categoryId: r.categoryId ?? null }));
    const couponBadge = cb ? { code: cb.code as string, label: cb.valueType === "percentage" ? `%${cb.value}` : `${cb.value} ₺`, color: cb.badgeColor || "#e07a5f", textColor: cb.badgeTextColor || null } : null;
    return { ...r, discount_percent: pct > 0 ? pct : null, discount_starts_at: null, discount_ends_at: null, salePrice, couponBadge };
  });
}

// 1. Home Categories
export const getHomeCategories = unstable_cache(
  async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("categories")
      .select('id, name, slug, "imageUrl"')
      .eq("show_on_home", true)
      .order("home_position", { ascending: true });
    return data ?? [];
  },
  ["home-categories"],
  { tags: ["categories"] }
);

// 1b. Nav Categories — tüm ana (üst seviye) kategoriler; site geneli ikon şeridi için
export const getNavCategories = unstable_cache(
  async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("categories")
      .select('id, name, slug, "imageUrl", "parentId"')
      .order("name");
    return (data ?? [])
      .filter((c) => !(c as { parentId?: string | null }).parentId)
      .map((c) => ({ id: c.id as string, name: c.name as string, slug: c.slug as string, imageUrl: (c as { imageUrl?: string | null }).imageUrl ?? null }));
  },
  ["nav-categories"],
  { tags: ["categories"] }
);

// 2. Products by Category IDs (for home rows)
export const getCategoryProductsForHome = unstable_cache(
  async (categoryIds: string[]) => {
    if (categoryIds.length === 0) return [];
    const db = createAdminClient();
    const { data } = await db
      .from("products_with_order_count")
      .select("id, name, slug, basePrice, images, categoryId, discount_percent, discount_starts_at, discount_ends_at, productTags:product_tags(tagId, position, tag:tags(name, color, text_color, is_active))")
      .in("categoryId", categoryIds)
      .eq("isActive", true)
      .order("createdAt", { ascending: false });
    return withItemPromotions(data ?? []);
  },
  ["home-category-products"],
  { tags: ["products", "promotions"] }
);

// 3. Featured Products
export const getFeaturedProducts = unstable_cache(
  async (limit: number = 12) => {
    const db = createAdminClient();
    const { data } = await db
      .from("products_with_order_count")
      .select("id, name, slug, basePrice, images, categoryId, discount_percent, discount_starts_at, discount_ends_at, productTags:product_tags(tagId, position, tag:tags(name, color, text_color, is_active))")
      .eq("is_featured", true)
      .eq("isActive", true)
      .order("featured_position", { ascending: true })
      .order("createdAt", { ascending: false })
      .limit(limit);
    return withItemPromotions(data ?? []);
  },
  ["featured-products"],
  { tags: ["products", "promotions"] }
);

// 3b. Flash Deals — süreli (discount_ends_at gelecekte) indirimli ürünler + en yakın bitiş
export const getFlashDeals = unstable_cache(
  async (limit: number = 8) => {
    const db = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data } = await db
      .from("products_with_order_count")
      .select("id, name, slug, basePrice, images, categoryId, discount_percent, discount_starts_at, discount_ends_at, productTags:product_tags(tagId, position, tag:tags(name, color, text_color, is_active))")
      .eq("isActive", true)
      .gt("discount_percent", 0)
      .not("discount_ends_at", "is", null)
      .gt("discount_ends_at", nowIso)
      .order("discount_ends_at", { ascending: true })
      .limit(limit);
    const rows = data ?? [];
    const endsAt = rows.length ? (rows[0].discount_ends_at as string) : null;
    const products = await withItemPromotions(rows);
    return { products, endsAt };
  },
  ["flash-deals"],
  { tags: ["products", "promotions"] }
);

// 3c. Campaign Cards — admin'in elle seçtiği görselli kampanya kartları (placement='card')
export type CampaignCard = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  cta_text: string | null;
  cta_url: string;
  coupon_code: string | null;
};

export const getCampaignCards = unstable_cache(
  async (): Promise<CampaignCard[]> => {
    const db = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data } = await db
      .from("campaigns")
      .select("id, title, subtitle, image_url, cta_text, cta_url, coupon_code, starts_at, ends_at")
      .eq("placement", "card")
      .eq("is_active", true)
      .eq("show_on_home", true)
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });
    return (data ?? [])
      .filter(
        (c) =>
          (!c.starts_at || (c.starts_at as string) <= nowIso) &&
          (!c.ends_at || (c.ends_at as string) >= nowIso)
      )
      .map((c) => ({
        id: c.id as string,
        title: c.title as string,
        subtitle: (c.subtitle as string | null) ?? null,
        image_url: c.image_url as string,
        cta_text: (c.cta_text as string | null) ?? null,
        cta_url: c.cta_url as string,
        coupon_code: (c.coupon_code as string | null) ?? null,
      }));
  },
  ["campaign-cards"],
  { tags: ["campaigns"] }
);

// 3d. Reprint Suggestions — kullanıcının daha önce sipariş ettiği aktif ürünler (yeni paid print)
export async function getReprintSuggestions(userId: string, limit: number = 8) {
  const db = createAdminClient();
  const { data: orders } = await db.from("orders").select("id").eq("userId", userId);
  const orderIds = (orders ?? []).map((o) => o.id as string);
  if (!orderIds.length) return [];
  const { data: oi } = await db.from("order_items").select('"productId"').in("orderId", orderIds);
  const pids = [...new Set((oi ?? []).map((i) => (i as { productId: string | null }).productId).filter(Boolean) as string[])];
  if (!pids.length) return [];
  const { data } = await db
    .from("products_with_order_count")
    .select("id, name, slug, basePrice, images, categoryId, discount_percent, discount_starts_at, discount_ends_at, productTags:product_tags(tagId, position, tag:tags(name, color, text_color, is_active))")
    .in("id", pids)
    .eq("isActive", true)
    .limit(limit);
  return withItemPromotions(data ?? []);
}

// 4. Hero Banners
export const getHeroBanners = unstable_cache(
  async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("campaigns")
      .select("id, image_url, title, subtitle, cta_text, cta_url, starts_at, ends_at")
      .eq("show_on_home", true)
      .eq("placement", "hero")
      .eq("is_active", true)
      .order("position", { ascending: true });
    return data ?? [];
  },
  ["hero-banners"],
  { tags: ["campaigns"] }
);

// 5. Tags for filtering — yalnız AKTİF ürünlere atanmış + aktif etiketler (boş/pasif etiket gösterme)
export const getTags = unstable_cache(
  async () => {
    const db = createAdminClient();
    // Adım 1: En az bir aktif ürüne atanmış tagId'lerini al
    const { data: ptRows } = await db
      .from("product_tags")
      .select("tagId, products!inner(isActive)")
      .eq("products.isActive", true);
    if (!ptRows?.length) return [];
    const assignedIds = [...new Set((ptRows as unknown as { tagId: string }[]).map(r => r.tagId))];
    // Adım 2: O tagId'lerin aktif etiket bilgilerini çek
    const { data: tagRows } = await db
      .from("tags")
      .select("id, name, color")
      .eq("is_active", true)
      .in("id", assignedIds);
    return (tagRows ?? []).sort((a, b) => a.name.localeCompare(b.name, "tr"));
  },
  ["catalog-tags"],
  { tags: ["tags", "products"] }
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
      .select("id, name, slug, description, basePrice, images, categoryId, discount_percent, discount_starts_at, discount_ends_at, category:categories!products_categoryId_fkey(name, slug), productTags:product_tags(tagId, position, tag:tags(name, color, text_color, is_active))")
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
    return withItemPromotions(data ?? []);
  },
  ["catalog-products"],
  { tags: ["products", "promotions"] }
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
      .select("id, name, slug, description, basePrice, images, categoryId, discount_percent, discount_starts_at, discount_ends_at, productTags:product_tags(tagId, position, tag:tags(name, color, text_color, is_active))")
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
    return withItemPromotions(data ?? []);
  },
  ["products-in-category"],
  { tags: ["products", "promotions"] }
);

// 13. Product by slug (for product details page)
export const getProductBySlug = unstable_cache(
  async (slug: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("products")
      .select("*, category:categories!products_categoryId_fkey(id, name, slug), productTags:product_tags(tagId, position, tag:tags(name, color, text_color, is_active))")
      .eq("slug", slug)
      .eq("isActive", true)
      .single();
    if (!data) return data;
    return (await withItemPromotions([data as unknown as DiscountableRow]))[0] as typeof data;
  },
  ["product-by-slug"],
  { tags: ["products", "promotions"] }
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
    const RELATED_COLS = "id, name, slug, basePrice, images, categoryId, discount_percent, discount_starts_at, discount_ends_at, productTags:product_tags(tagId, position, tag:tags(name, color, text_color, is_active))";
    const { data } = await db
      .from("products_with_order_count")
      .select(RELATED_COLS)
      .eq("categoryId", categoryId)
      .eq("isActive", true)
      .neq("id", productId)
      .limit(24);
    return withItemPromotions(data ?? []);
  },
  ["related-products-same-category"],
  { tags: ["products", "promotions"] }
);

// 16. Related products fallback (featured/newest)
export const getRelatedProductsFallback = unstable_cache(
  async (productId: string) => {
    const db = createAdminClient();
    const RELATED_COLS = "id, name, slug, basePrice, images, categoryId, discount_percent, discount_starts_at, discount_ends_at, productTags:product_tags(tagId, position, tag:tags(name, color, text_color, is_active))";
    const { data } = await db
      .from("products_with_order_count")
      .select(RELATED_COLS)
      .eq("isActive", true)
      .neq("id", productId)
      .order("is_featured", { ascending: false })
      .order("createdAt", { ascending: false })
      .limit(16);
    return withItemPromotions(data ?? []);
  },
  ["related-products-fallback"],
  { tags: ["products", "promotions"] }
);
