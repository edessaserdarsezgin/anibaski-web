# İndirim Modülü Faz 1 — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ürün indirimi / kupon / sepet-eşikli / kampanyayı tek birleşik `promotions` modeli + iki-katmanlı hesap motoru + tek "İndirim" admin merkezi altında topla; her indirim kapsam (tüm/kategori/ürün) seçebilsin ve kısmi uygulansın.

**Architecture:** Tek `promotions` tablosu (+ `promotion_products`/`_categories` join). İki katman: A=`apply_level=item` otomatik (kartta üstü-çizili), B=`apply_level=cart` kupon/eşik (sepet özeti). Sunucu otoritatif `/api/orders`. Saf hesap `promotionsCalc.ts` (client-safe), server getter `promotions.ts` (cache tag `promotions`). Mevcut kupon/cart-discount/ürün-sale göç edilir; eski yollar cutover'da kaldırılır.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (Postgres, service-role admin client), `unstable_cache`/`revalidateTag`. Test: `tsc --noEmit` + node (saf hesap) + Supabase MCP/curl (canlı). **Jest/vitest YOK.**

**Referans spec:** `docs/superpowers/specs/2026-06-11-indirim-modulu-faz1-design.md`

**Sıralama mantığı:** Önce additive (yeni tablo+lib+admin, app eski yollarda çalışmaya devam eder) → sonra cutover (fiyat motoru + kart + sepet/ödeme atomik geçiş) → sonra eski yolların kaldırılması → en son eski tablo DROP (ayrı migration).

---

### Task 1: Şema — promotions + join tabloları + campaigns.promotion_id

**Files:**
- Migration (Supabase MCP `apply_migration`, name `promotions_schema`)

- [ ] **Step 1: Migration'ı uygula**

```sql
CREATE TABLE IF NOT EXISTS promotions (
  id            text PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  name          text NOT NULL,
  trigger       text NOT NULL,                         -- 'auto' | 'code'
  apply_level   text NOT NULL,                          -- 'item' | 'cart'
  deal_type     text NOT NULL DEFAULT 'flat',           -- 'flat' | 'bogo'(Faz2)
  code          text UNIQUE,
  scope         text NOT NULL DEFAULT 'all',            -- 'all' | 'products' | 'categories'
  value_type    text NOT NULL DEFAULT 'percentage',     -- 'percentage' | 'fixed'
  value         numeric NOT NULL,
  min_subtotal  numeric,
  starts_at     timestamptz,
  ends_at       timestamptz,
  max_uses      integer,
  used_count    integer NOT NULL DEFAULT 0,
  first_order_only boolean NOT NULL DEFAULT false,
  priority      integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS promotion_products (
  promotion_id text NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id   text NOT NULL,
  PRIMARY KEY (promotion_id, product_id)
);
CREATE TABLE IF NOT EXISTS promotion_categories (
  promotion_id text NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  category_id  text NOT NULL,
  PRIMARY KEY (promotion_id, category_id)
);
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS promotion_id text;
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions (is_active, trigger, apply_level);
CREATE INDEX IF NOT EXISTS idx_promo_products_pid ON promotion_products (product_id);
CREATE INDEX IF NOT EXISTS idx_promo_categories_cid ON promotion_categories (category_id);
```

Not: `products.id` ve `categories.id` text — FK eklenmedi (join tabloları text id ile çalışır; mevcut proje deseninde FK seyrek). `ON DELETE CASCADE` yalnız promotion silinince hedefleri temizler.

- [ ] **Step 2: RLS doğrula**

Supabase MCP `get_advisors(security)` çağır. Beklenen: yeni 3 tablo için `rls_enabled_no_policy` **INFO** (proje deseni — service-role erişimi). ERROR olmamalı.

- [ ] **Step 3: Commit (kod yok, migration Supabase'de — local commit gerekmez)**

Migration sistemi Supabase. Bu task'ta git commit yok.

---

### Task 2: Saf hesap — `lib/promotionsCalc.ts` + node testleri

**Files:**
- Create: `src/lib/promotionsCalc.ts`

- [ ] **Step 1: Tipleri ve saf fonksiyonları yaz**

```typescript
// İndirim saf hesabı — sunucu bağımlılığı YOK (client'ten de import edilir).
export type Promotion = {
  id: string;
  name: string;
  trigger: "auto" | "code";
  applyLevel: "item" | "cart";
  dealType: "flat" | "bogo";
  code: string | null;
  scope: "all" | "products" | "categories";
  valueType: "percentage" | "fixed";
  value: number;
  minSubtotal: number | null;
  startsAt: string | null;
  endsAt: string | null;
  maxUses: number | null;
  usedCount: number;
  firstOrderOnly: boolean;
  priority: number;
  productIds: string[];      // scope='products'
  categoryIds: string[];     // scope='categories'
};

export type PricedItem = { productId: string; categoryId: string | null; unitPrice: number; quantity: number };

/** Promotion tarih penceresi şu an geçerli mi? */
export function isDateValid(p: Pick<Promotion, "startsAt" | "endsAt">, now = new Date()): boolean {
  if (p.startsAt && new Date(p.startsAt) > now) return false;
  if (p.endsAt && new Date(p.endsAt) < now) return false;
  return true;
}

/** Bir kalem promotion'ın kapsamına giriyor mu? */
export function itemInScope(p: Promotion, item: { productId: string; categoryId: string | null }): boolean {
  if (p.scope === "all") return true;
  if (p.scope === "products") return p.productIds.includes(item.productId);
  if (p.scope === "categories") return !!item.categoryId && p.categoryIds.includes(item.categoryId);
  return false;
}

/** Bir kaleme uygulanacak yüzde/sabit indirim tutarı (birim başına değil, kalem için toplam). */
function flatAmountForLine(p: Promotion, lineTotal: number): number {
  return p.valueType === "percentage"
    ? Math.round(lineTotal * (p.value / 100) * 100) / 100
    : Math.min(p.value, lineTotal);
}

/**
 * Katman A — bir kaleme en iyi OTOMATIK item indirimi.
 * Öncelik: kapsam özgüllüğü (products > categories > all), eşitlikte en yüksek tutar, sonra priority.
 * Döner: indirimli birim fiyat + uygulanan promotion (yoksa null).
 */
export function bestItemDiscount(
  item: { productId: string; categoryId: string | null; unitPrice: number },
  itemPromos: Promotion[],
  now = new Date()
): { unitPrice: number; promo: Promotion | null } {
  const specificity = (p: Promotion) => (p.scope === "products" ? 3 : p.scope === "categories" ? 2 : 1);
  let best: Promotion | null = null;
  let bestAmt = 0;
  for (const p of itemPromos) {
    if (p.applyLevel !== "item" || p.trigger !== "auto" || p.dealType !== "flat") continue;
    if (!isDateValid(p, now) || !itemInScope(p, item)) continue;
    const amt = flatAmountForLine(p, item.unitPrice);
    if (amt <= 0) continue;
    if (!best || specificity(p) > specificity(best) ||
        (specificity(p) === specificity(best) && (amt > bestAmt || (amt === bestAmt && p.priority > best.priority)))) {
      best = p; bestAmt = amt;
    }
  }
  return { unitPrice: best ? Math.round((item.unitPrice - bestAmt) * 100) / 100 : item.unitPrice, promo: best };
}

/**
 * Katman B — bir cart promotion'ın (kupon veya eşik) indirim tutarı.
 * Kapsam-kısmi: yalnız eşleşen kalemlerin (Katman A sonrası) tutarına uygulanır.
 * Koşullar (min_subtotal, tarih) çağıran tarafından kontrol edilir; burada yalnız tutar.
 */
export function cartPromoAmount(p: Promotion, items: PricedItem[]): number {
  const matchedTotal = items
    .filter((it) => itemInScope(p, it))
    .reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  if (matchedTotal <= 0) return 0;
  return p.valueType === "percentage"
    ? Math.round(matchedTotal * (p.value / 100) * 100) / 100
    : Math.min(p.value, matchedTotal);
}

/** Sonraki ulaşılabilir sepet-eşikli kademe (nudge için). */
export function nextThreshold(subtotal: number, cartAutoPromos: Promotion[]): Promotion | null {
  return cartAutoPromos
    .filter((p) => p.trigger === "auto" && p.minSubtotal != null && subtotal < p.minSubtotal)
    .sort((a, b) => (a.minSubtotal! - b.minSubtotal!))[0] ?? null;
}
```

- [ ] **Step 2: Node ile saf hesabı doğrula**

Run (proje kökünde):
```bash
node --input-type=module -e '
import { bestItemDiscount, cartPromoAmount, itemInScope } from "./src/lib/promotionsCalc.ts";
' 2>/dev/null || echo "ts node import desteklemiyor — saf mantığı inline test et:"
```
TS doğrudan node ile çalışmaz; bunun yerine mantığı geçici JS olarak kopyalayıp test et VEYA Step 3'teki tsc ile tip güvenliğine güven + Task 5'teki canlı testte uçtan uca doğrula. (Mevcut proje deseni: saf mantık node'da JS kopyasıyla test edildi.)

Inline mantık testi (JS kopyası):
```bash
node --input-type=module -e '
const spec=p=>p.scope==="products"?3:p.scope==="categories"?2:1;
const inScope=(p,i)=>p.scope==="all"||(p.scope==="products"&&p.productIds.includes(i.productId))||(p.scope==="categories"&&i.categoryId&&p.categoryIds.includes(i.categoryId));
function best(item,promos){let b=null,ba=0;for(const p of promos){if(!inScope(p,item))continue;const a=p.valueType==="percentage"?Math.round(item.unitPrice*p.value/100*100)/100:Math.min(p.value,item.unitPrice);if(a<=0)continue;if(!b||spec(p)>spec(b)||(spec(p)===spec(b)&&a>ba)){b=p;ba=a;}}return{unitPrice:b?item.unitPrice-ba:item.unitPrice,promo:b?b.name:null};}
const item={productId:"P1",categoryId:"C1",unitPrice:100};
const promos=[
 {name:"tum%10",scope:"all",valueType:"percentage",value:10,productIds:[],categoryIds:[]},
 {name:"kat%20",scope:"categories",valueType:"percentage",value:20,productIds:[],categoryIds:["C1"]},
 {name:"urun%30",scope:"products",valueType:"percentage",value:30,productIds:["P1"],categoryIds:[]},
];
console.log("hepsi var → ürün kazanmalı:", best(item,promos));            // urun%30 → 70
console.log("yalnız tüm+kat → kat kazanmalı:", best(item,promos.slice(0,2))); // kat%20 → 80
console.log("kapsam dışı ürün:", best({productId:"P9",categoryId:"C9",unitPrice:100},promos)); // null → 100
'
```
Expected: ürün>kategori>tüm önceliği doğru (70 / 80 / 100).

- [ ] **Step 3: tsc temiz**

Run: `npx tsc --noEmit` → EXIT 0.

- [ ] **Step 4: Commit**

```bash
git add src/lib/promotionsCalc.ts
git commit -m "feat(indirim): promotionsCalc saf hesap (kapsam+katman A/B)"
```

---

### Task 3: Server getter'lar — `lib/promotions.ts`

**Files:**
- Create: `src/lib/promotions.ts`

- [ ] **Step 1: Cache'li getter'lar + kupon doğrulama yaz**

```typescript
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { Promotion } from "@/lib/promotionsCalc";
import { isDateValid, itemInScope, cartPromoAmount } from "@/lib/promotionsCalc";
export { } from "@/lib/promotionsCalc";

type Row = Record<string, unknown>;
function mapRow(r: Row, prodMap: Map<string, string[]>, catMap: Map<string, string[]>): Promotion {
  return {
    id: r.id as string, name: r.name as string,
    trigger: r.trigger as "auto" | "code", applyLevel: r.apply_level as "item" | "cart",
    dealType: (r.deal_type as "flat" | "bogo") ?? "flat", code: (r.code as string) ?? null,
    scope: r.scope as Promotion["scope"], valueType: r.value_type as Promotion["valueType"],
    value: Number(r.value), minSubtotal: r.min_subtotal == null ? null : Number(r.min_subtotal),
    startsAt: (r.starts_at as string) ?? null, endsAt: (r.ends_at as string) ?? null,
    maxUses: r.max_uses == null ? null : Number(r.max_uses), usedCount: Number(r.used_count ?? 0),
    firstOrderOnly: !!r.first_order_only, priority: Number(r.priority ?? 0),
    productIds: prodMap.get(r.id as string) ?? [], categoryIds: catMap.get(r.id as string) ?? [],
  };
}

async function loadPromotions(filter: { applyLevel: "item" | "cart"; trigger?: "auto" | "code" }): Promise<Promotion[]> {
  const db = createAdminClient();
  let q = db.from("promotions").select("*").eq("is_active", true).eq("apply_level", filter.applyLevel).eq("deal_type", "flat");
  if (filter.trigger) q = q.eq("trigger", filter.trigger);
  const { data: rows } = await q;
  const ids = (rows ?? []).map((r) => r.id as string);
  const prodMap = new Map<string, string[]>(); const catMap = new Map<string, string[]>();
  if (ids.length) {
    const [{ data: pp }, { data: pc }] = await Promise.all([
      db.from("promotion_products").select("promotion_id, product_id").in("promotion_id", ids),
      db.from("promotion_categories").select("promotion_id, category_id").in("promotion_id", ids),
    ]);
    for (const x of pp ?? []) { const a = prodMap.get(x.promotion_id) ?? []; a.push(x.product_id); prodMap.set(x.promotion_id, a); }
    for (const x of pc ?? []) { const a = catMap.get(x.promotion_id) ?? []; a.push(x.category_id); catMap.set(x.promotion_id, a); }
  }
  return (rows ?? []).map((r) => mapRow(r, prodMap, catMap));
}

/** Katman A — aktif otomatik item indirimleri (kart + sipariş fiyatı). Cache tag: "promotions". */
export const getActiveItemPromotions = unstable_cache(
  () => loadPromotions({ applyLevel: "item", trigger: "auto" }),
  ["promotions-item"], { tags: ["promotions"] }
);

/** Katman B — aktif otomatik cart (sepet eşikli) indirimleri. Cache tag: "promotions". */
export const getActiveCartAutoPromotions = unstable_cache(
  () => loadPromotions({ applyLevel: "cart", trigger: "auto" }),
  ["promotions-cart-auto"], { tags: ["promotions"] }
);

/** Üyenin önceki tamamlanmış (paid/cod) siparişi var mı? (ilk-sipariş kuponu) */
export async function hasPriorOrder(userId: string): Promise<boolean> {
  const db = createAdminClient();
  const { count } = await db.from("orders").select("id", { count: "exact", head: true })
    .eq("userId", userId).or("paymentStatus.eq.paid,paymentMethod.eq.cod");
  return (count ?? 0) > 0;
}

/**
 * Kupon kodunu doğrula (kapsam-aware). Geçerliyse promotion + indirim tutarını döner.
 * items: Katman A SONRASI fiyatlı kalemler. subtotal: indirimli ara toplam.
 */
export async function validateCoupon(
  code: string, items: { productId: string; categoryId: string | null; unitPrice: number; quantity: number }[],
  subtotal: number, userId: string
): Promise<{ ok: true; promo: Promotion; amount: number } | { ok: false; error: string }> {
  const db = createAdminClient();
  const { data: rows } = await db.from("promotions").select("*")
    .eq("code", code.trim().toUpperCase()).eq("trigger", "code").eq("is_active", true).limit(1);
  const row = rows?.[0];
  if (!row) return { ok: false, error: "Geçersiz veya kullanılmış kupon kodu." };
  const [{ data: pp }, { data: pc }] = await Promise.all([
    db.from("promotion_products").select("product_id").eq("promotion_id", row.id),
    db.from("promotion_categories").select("category_id").eq("promotion_id", row.id),
  ]);
  const prodMap = new Map([[row.id as string, (pp ?? []).map((x) => x.product_id)]]);
  const catMap = new Map([[row.id as string, (pc ?? []).map((x) => x.category_id)]]);
  const promo = mapRow(row, prodMap, catMap);

  if (!isDateValid(promo)) return { ok: false, error: "Bu kuponun süresi dolmuş." };
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return { ok: false, error: "Bu kupon kullanım limitine ulaşmış." };
  if (promo.minSubtotal && subtotal < promo.minSubtotal)
    return { ok: false, error: `Bu kupon için minimum sipariş tutarı ${promo.minSubtotal.toLocaleString("tr-TR")} ₺.` };
  if (promo.firstOrderOnly && await hasPriorOrder(userId)) return { ok: false, error: "Bu kupon yalnızca ilk siparişte geçerli." };
  const amount = cartPromoAmount(promo, items);
  if (amount <= 0) return { ok: false, error: "Bu kupon sepetinizdeki ürünlerde geçerli değil." };
  return { ok: true, promo, amount };
}
```

- [ ] **Step 2: tsc temiz** — Run `npx tsc --noEmit` → EXIT 0.

- [ ] **Step 3: Commit**

```bash
git add src/lib/promotions.ts
git commit -m "feat(indirim): promotions server getter'lar + kapsam-aware kupon doğrulama"
```

---

### Task 4: Veri göçü (idempotent SQL)

**Files:**
- Migration (Supabase MCP `apply_migration`, name `promotions_data_migration`)

- [ ] **Step 1: Göç SQL'i uygula** (idempotent — `ends_at` = eski `expires_at`)

```sql
-- 1) Kuponlar → promotions (trigger=code, cart, all)
INSERT INTO promotions (id, name, trigger, apply_level, deal_type, code, scope, value_type, value,
                        min_subtotal, ends_at, max_uses, used_count, first_order_only, is_active)
SELECT c.id, c.code, 'code', 'cart', 'flat', c.code, 'all', c.discount_type, c.discount_value,
       c.min_order_amount, c.expires_at, c.max_uses, c.used_count, c.first_order_only, c.is_active
FROM coupons c
WHERE NOT EXISTS (SELECT 1 FROM promotions p WHERE p.id = c.id);

-- 2) Sepet eşikli kademeler → promotions (trigger=auto, cart, all). config.enabled=false ise is_active=false.
INSERT INTO promotions (id, name, trigger, apply_level, deal_type, scope, value_type, value, min_subtotal, is_active)
SELECT t.id,
       'Sepet ' || t.min_subtotal || '₺ üzeri',
       'auto', 'cart', 'flat', 'all', t.discount_type, t.discount_value, t.min_subtotal,
       (t.is_active AND coalesce((SELECT enabled FROM cart_discount_config WHERE id=1), true))
FROM cart_discount_tiers t
WHERE NOT EXISTS (SELECT 1 FROM promotions p WHERE p.id = t.id);

-- 3) Ürün indirimi → promotions (trigger=auto, item, products → o ürün)
INSERT INTO promotions (id, name, trigger, apply_level, deal_type, scope, value_type, value, starts_at, ends_at, is_active)
SELECT 'prod-' || pr.id,
       pr.name || ' indirimi',
       'auto', 'item', 'flat', 'products', 'percentage', pr.discount_percent,
       pr.discount_starts_at, pr.discount_ends_at, true
FROM products pr
WHERE pr.discount_percent IS NOT NULL AND pr.discount_percent > 0
  AND NOT EXISTS (SELECT 1 FROM promotions p WHERE p.id = 'prod-' || pr.id);

INSERT INTO promotion_products (promotion_id, product_id)
SELECT 'prod-' || pr.id, pr.id
FROM products pr
WHERE pr.discount_percent IS NOT NULL AND pr.discount_percent > 0
  AND NOT EXISTS (SELECT 1 FROM promotion_products pp WHERE pp.promotion_id = 'prod-' || pr.id AND pp.product_id = pr.id);

-- 4) Kampanya coupon_code → promotion_id (kupon promotion'ı id=coupon.id ile aynı kod)
UPDATE campaigns ca SET promotion_id = (
  SELECT p.id FROM promotions p WHERE p.code = ca.coupon_code LIMIT 1
) WHERE ca.coupon_code IS NOT NULL AND ca.promotion_id IS NULL;
```

- [ ] **Step 2: Göçü doğrula (Supabase MCP execute_sql)**

```sql
SELECT trigger, apply_level, scope, count(*) FROM promotions GROUP BY 1,2,3 ORDER BY 1,2,3;
SELECT count(*) AS prod_targets FROM promotion_products;
SELECT count(*) AS campaign_links FROM campaigns WHERE promotion_id IS NOT NULL;
```
Expected: coupons sayısı kadar code/cart, cart_discount_tiers kadar auto/cart, indirimli ürün kadar auto/item + prod_targets. Kampanya kupon_code'ları bağlanmış.

- [ ] **Step 3: Commit yok** (Supabase migration).

---

### Task 5: `/api/orders` motor cutover (iki katman)

**Files:**
- Modify: `src/app/api/orders/route.ts`

- [ ] **Step 1: İmportları güncelle**

`@/lib/coupons` ve `@/lib/cartDiscount` importlarını kaldır; ekle:
```typescript
import { getActiveItemPromotions, getActiveCartAutoPromotions, validateCoupon } from "@/lib/promotions";
import { bestItemDiscount, cartPromoAmount, isDateValid } from "@/lib/promotionsCalc";
```

- [ ] **Step 2: Kalem fiyatlamada Katman A uygula**

Mevcut `computedItems` döngüsünde her kalemin `unitPrice`'ı `activeDiscountPercent(product)` ile hesaplanıyor. Bunu promotions Katman A ile değiştir: ürün varyant+base'den `fullUnit` hesapla (mevcut), sonra:
```typescript
const itemPromos = await getActiveItemPromotions();
// ... döngü içinde, fullUnit hesaplandıktan sonra:
const { unitPrice } = bestItemDiscount(
  { productId: product.id, categoryId: product.categoryId ?? null, unitPrice: fullUnit },
  itemPromos
);
```
(Not: `products` select'ine `categoryId` ekle — Step gereği `adminDb.from("products").select("id, basePrice, ..., \"categoryId\"")`.)

`computedItems` artık Katman A sonrası `unitPrice` taşır. `subtotal` bunlardan hesaplanır (mevcut mantık korunur).

- [ ] **Step 3: Katman B (kupon vs sepet-eşikli max) uygula**

Eski kupon + cart-discount bloğunu şununla değiştir:
```typescript
const pricedItems = computedItems.map((it) => ({
  productId: it.productId, categoryId: it.categoryId ?? null, unitPrice: it.unitPrice, quantity: it.quantity,
}));

// Kupon (kod)
let couponAmount = 0; let couponPromo: Awaited<ReturnType<typeof validateCoupon>> | null = null;
if (discountCode) {
  const res = await validateCoupon(discountCode, pricedItems, subtotal, user.id);
  if (res.ok) { couponAmount = res.amount; couponPromo = res; }
}
// Sepet eşikli (auto): koşul (min_subtotal, tarih) geçenlerden en iyi tutar
const cartAutos = await getActiveCartAutoPromotions();
let autoAmount = 0;
for (const p of cartAutos) {
  if (!isDateValid(p)) continue;
  if (p.minSubtotal && subtotal < p.minSubtotal) continue;
  const amt = cartPromoAmount(p, pricedItems);
  if (amt > autoAmount) autoAmount = amt;
}
// Büyüğü uygulanır
let discountAmount = 0; let validatedCouponCode: string | null = null;
if (couponPromo && couponPromo.ok && couponAmount >= autoAmount) {
  discountAmount = couponAmount; validatedCouponCode = couponPromo.promo.code;
  if (paymentMethod === "cod") {
    const newCount = couponPromo.promo.usedCount + 1;
    const limitReached = couponPromo.promo.maxUses !== null && newCount >= couponPromo.promo.maxUses;
    await createAdminClient().from("promotions").update({
      used_count: newCount, ...(limitReached && { is_active: false }),
    }).eq("id", couponPromo.promo.id);
  }
} else {
  discountAmount = autoAmount;
}
const total = Math.round((subtotal + shippingFee - discountAmount) * 100) / 100;
```
(`couponPromo` tipi sadeleştirilebilir; gerekirse `res.ok` dar tipi için ayrı değişken tut.)

- [ ] **Step 4: tsc temiz** — `npx tsc --noEmit` → EXIT 0.

- [ ] **Step 5: Canlı doğrula (Supabase MCP + curl, preview)**

Sentetik test: bir `promotions` satırı ekle (örn. scope=all auto item %10), `/api/orders`'a (auth'lu — preview UI'dan ya da test verisiyle) küçük sipariş ver, dönen `total`/`discount_amount`'ı SQL'le kontrol et. Gerçek veri yok → güvenli. Sonra sentetik promotion'ı sil.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/orders/route.ts
git commit -m "feat(indirim): /api/orders iki-katmanlı promotions motoru"
```

---

### Task 6: `/api/coupons/validate` → promotions-aware

**Files:**
- Modify: `src/app/api/coupons/validate/route.ts`

- [ ] **Step 1: validateCoupon kullan**

İstek gövdesini `{ code, items }` alacak şekilde genişlet (kapsam-kısmi için kalemler gerekir). Sepet sayfası `items`'ı (productId, categoryId, unitPrice=Katman A sonrası, quantity) gönderir. Body:
```typescript
const { code, items } = await req.json() as { code: string; items: { productId: string; categoryId: string | null; unitPrice: number; quantity: number }[] };
const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
const res = await validateCoupon(code, items, subtotal, user.id);
if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
return NextResponse.json({ code: res.promo.code, discountAmount: res.amount });
```
(Eski `discountType/discountValue` dönüşü kalkar; sepet artık `discountAmount`'ı doğrudan kullanır. Sepet sayfası buna göre güncellenir — Task 8.)

- [ ] **Step 2: tsc temiz** — EXIT 0.
- [ ] **Step 3: Commit**

```bash
git add src/app/api/coupons/validate/route.ts
git commit -m "feat(indirim): kupon doğrulama promotions+kapsam üzerinden"
```

---

### Task 7: Kart fiyatı promotion-aware (katalog)

**Files:**
- Modify: `src/lib/pricing.ts`, `src/lib/catalog.ts` (ve ürün kartı tüketicileri)

- [ ] **Step 1: pricing.ts'e promotion-aware efektif fiyat helper'ı ekle**

`activeDiscountPercent` ürün-içi `discount_percent`'e bakıyordu. Yeni: kart için, ürünün `categoryId`'sini ve aktif item-promotion listesini alıp `bestItemDiscount` ile efektif fiyat/indirim hesapla. Helper:
```typescript
import { bestItemDiscount, type Promotion } from "@/lib/promotionsCalc";
export function effectiveProductPrice(
  product: { id: string; categoryId: string | null; basePrice: number },
  itemPromos: Promotion[]
): { price: number; discountPercent: number } {
  const { unitPrice, promo } = bestItemDiscount(
    { productId: product.id, categoryId: product.categoryId, unitPrice: Number(product.basePrice) }, itemPromos
  );
  const pct = promo && promo.valueType === "percentage" ? promo.value : (Number(product.basePrice) > 0 ? Math.round((1 - unitPrice / Number(product.basePrice)) * 100) : 0);
  return { price: unitPrice, discountPercent: pct };
}
```

- [ ] **Step 2: Katalog cached sorgularında uygula**

`lib/catalog.ts`'teki ürün listeleyen cached fonksiyonlar (`getProductsByCategory`, `getAllProducts`, `getProductBySlug`, ilgili) `getActiveItemPromotions()` çağırıp her ürüne `effectiveProductPrice` uygular, sonucu ürün objesine (`effectivePrice`, `discountPercent`) ekler. Cache tag'lerine `promotions` ekle ki indirim değişince invalidate olsun. `PriceTag`/`ProductCard` bu yeni alanları gösterir (mevcut `discount_percent` yerine).

DİKKAT: Bu adım katalog tüketicilerini (ProductCard, GuideProductCard, vb.) `discount_percent` yerine yeni alanlara geçirmeyi içerir — mevcut kullanım yerlerini grep'le bul (`grep -rn "discount_percent\|activeDiscountPercent" src`), her birini güncelle.

- [ ] **Step 3: tsc temiz + görsel kontrol (preview, kullanıcı)** — EXIT 0; bir kategori-kapsamlı promotion ekleyip kartta üstü-çizili göründüğünü doğrula.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pricing.ts src/lib/catalog.ts src/components/product/ src/app/
git commit -m "feat(indirim): ürün kartı efektif fiyatı promotions-aware (kategori dahil)"
```

---

### Task 8: Public `/api/promotions` + sepet/ödeme gösterim

**Files:**
- Create: `src/app/api/promotions/route.ts`
- Modify: `src/app/(shop)/sepet/page.tsx`, `src/app/(shop)/odeme/CheckoutClient.tsx`

- [ ] **Step 1: Public endpoint**

```typescript
import { NextResponse } from "next/server";
import { getActiveCartAutoPromotions } from "@/lib/promotions";
export async function GET() {
  // Yalnız cart-auto (sepet eşikli) gösterim/nudge için; item indirimleri zaten kart fiyatında.
  const cartAutos = await getActiveCartAutoPromotions();
  return NextResponse.json({ cartAutos });
}
```

- [ ] **Step 2: Sepet sayfası — kapsam-kısmi indirim + nudge**

`sepet/page.tsx`: `/api/cart-discount` çağrısını `/api/promotions`'a çevir; `bestCartDiscount` yerine `cartPromoAmount` + `nextThreshold` (promotionsCalc) kullan. Kupon `discountAmount`'ı validate endpoint'inden gelir (Task 6). Kalemlere `categoryId` eklemek için sepet item'ı `categoryId` taşımalı — useCart/cart item şemasına `categoryId` ekle (AddToCartButton sepete yazarken product.categoryId'yi de koyar). Efektif indirim = `max(couponAmount, autoAmount)`; gösterim mevcut desenle (couponWins ? kod : "Sepet indirimi").

- [ ] **Step 3: CheckoutClient — aynı kapsam-kısmi mantık**

`odeme/CheckoutClient.tsx`: `/api/cart-discount` → `/api/promotions`; `cartPromoAmount`+kupon ile efektif indirim; sunucu ile eşleşsin.

- [ ] **Step 4: tsc temiz** — EXIT 0.
- [ ] **Step 5: Commit**

```bash
git add src/app/api/promotions/route.ts "src/app/(shop)/sepet/page.tsx" "src/app/(shop)/odeme/CheckoutClient.tsx" src/hooks/useCart.ts
git commit -m "feat(indirim): public promotions endpoint + sepet/ödeme kapsam-kısmi gösterim"
```

---

### Task 9: Admin API — `/api/admin/promotions` + `/[id]`

**Files:**
- Create: `src/app/api/admin/promotions/route.ts`, `src/app/api/admin/promotions/[id]/route.ts`

- [ ] **Step 1: Koleksiyon route (GET liste + POST oluştur)**

GET: tüm promotions + hedef sayıları (join). POST: body'den promotion + `productIds`/`categoryIds` al; `promotions` insert et, sonra join tablolarına yaz; `revalidateTag("promotions","max")`. Doğrulama: trigger/apply_level/scope/value_type enum; percentage 1–99; code zorunlu trigger=code'da (UNIQUE çakışmasını yakala). Model `requireAdmin()` + mevcut `api/admin/coupons` deseni.

- [ ] **Step 2: `[id]` route (PATCH düzenle/aktif-pasif, DELETE)**

PATCH: alanları map et (camel→snake); `productIds`/`categoryIds` verildiyse join'leri sil-yeniden yaz. DELETE: promotions sil (CASCADE join). Her ikisi `revalidateTag("promotions","max")`.

- [ ] **Step 3: tsc temiz** — EXIT 0.
- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/promotions/
git commit -m "feat(indirim): admin promotions CRUD API"
```

---

### Task 10: Admin "İndirim" sayfası + menü

**Files:**
- Create: `src/app/admin/indirim/page.tsx`
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: İndirim yönetim sayfası**

`admin/sepet-indirimi/page.tsx` ve `admin/kuponlar/page.tsx` desenini birleştir: liste (Ad/Tür/Kapsam/Değer/Tarih/Kullanım/Durum-toggle, türe göre filtre) + "Yeni İndirim" formu (Ad · Tür: Otomatik(item)/Kupon(cart-code) · Kapsam: Tüm/Kategoriler(çoklu seç)/Ürünler(çoklu seç) · değer tipi+değer · tarih · kupon ise kod/min/max/ilk-sipariş · eşikli ise min_subtotal · öncelik). Kategori/ürün çoklu seçici için mevcut admin'de kategori/ürün listesi API'lerini kullan (örn. `/api/admin/categories`, ürün arama). Düzenle satır-içi (kuponlar deseni).

- [ ] **Step 2: Menü güncelle**

`admin/layout.tsx`: `{ href: "/admin/kuponlar", label: "Kuponlar" }` ve `{ href: "/admin/sepet-indirimi", label: "Sepet İndirimi" }` satırlarını **tek** `{ href: "/admin/indirim", label: "İndirim" }` ile değiştir.

- [ ] **Step 3: tsc temiz + görsel (kullanıcı)** — EXIT 0; sayfadan otomatik+kupon+eşikli oluştur/düzenle/sil çalışıyor.
- [ ] **Step 4: Commit**

```bash
git add src/app/admin/indirim/page.tsx src/app/admin/layout.tsx
git commit -m "feat(indirim): tek 'İndirim' admin sayfası + menü"
```

---

### Task 11: Kampanya formu → promotion seçici

**Files:**
- Modify: `src/app/admin/kampanyalar/CampaignForm.tsx`, `src/app/api/admin/campaigns/route.ts` + `/[id]/route.ts`

- [ ] **Step 1: Form + API**

CampaignForm'da `coupon_code` metin alanını **promotion seçici** (aktif promotions dropdown) ile değiştir; gönderilen `promotionId`. Campaigns API POST/PATCH `promotion_id` yazar (eski `coupon_code` artık yazılmaz). Public kampanya tüketimi (`/kampanyalar`, HeroBanner) gerekiyorsa promotion'dan kod/etiket gösterir.

- [ ] **Step 2: tsc temiz** — EXIT 0.
- [ ] **Step 3: Commit**

```bash
git add src/app/admin/kampanyalar/CampaignForm.tsx src/app/api/admin/campaigns/
git commit -m "feat(indirim): kampanya bir promotion'a bağlanır (coupon_code yerine)"
```

---

### Task 12: Eski yolları kaldır + menü/temizlik

**Files:**
- Delete: `src/app/admin/kuponlar/`, `src/app/admin/sepet-indirimi/`, `src/lib/coupons.ts`, `src/lib/cartDiscount.ts`, `src/lib/cartDiscountCalc.ts`, `src/app/api/cart-discount/`, `src/app/api/admin/cart-discount/`, `src/app/api/admin/coupons/`

- [ ] **Step 1: Referansları temizle**

`grep -rn "lib/coupons\|cartDiscount\|cart-discount\|admin/coupons\|admin/kuponlar\|admin/sepet-indirimi" src` ile kalan importları bul, hepsi promotions'a taşınmış olmalı. Kalan yoksa dosyaları sil.

- [ ] **Step 2: tsc temiz** — `npx tsc --noEmit` → EXIT 0 (sarkan import yok).
- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(indirim): eski kupon/sepet-indirim kod yollarını kaldır"
```

---

### Task 13: Eski tablo/kolon DROP (en son, ayrı migration)

**Files:**
- Migration (Supabase MCP `apply_migration`, name `drop_legacy_discount_tables`)

- [ ] **Step 1: Yalnız her şey çalıştığı DOĞRULANDIKTAN sonra uygula**

```sql
DROP TABLE IF EXISTS cart_discount_tiers;
DROP TABLE IF EXISTS cart_discount_config;
DROP TABLE IF EXISTS coupons;
ALTER TABLE products DROP COLUMN IF EXISTS discount_percent,
                     DROP COLUMN IF EXISTS discount_starts_at,
                     DROP COLUMN IF EXISTS discount_ends_at;
ALTER TABLE campaigns DROP COLUMN IF EXISTS coupon_code;
```
DİKKAT: Bu geri alınamaz. Faz 1'in tüm canlı testleri geçmeden ÇALIŞTIRMA. İstersen bu task'ı bir sonraki oturuma ertele.

- [ ] **Step 2: get_advisors + son tsc** — temiz.

---

## Belgeleme Güncellemeleri (uygulama bitince)

- `EKLENEN_OZELLIKLER.MD`: birleşik İndirim modülü (Faz 1).
- `SORUNLAR.MD`: "ürüne özel kupon/kampanya" + "merkezi indirim sistemi" maddeleri → kapandı.
- `02_DB_SCHEMA.md` / `CLAUDE.md` şema bloğu: promotions tabloları; coupons/cart_discount kaldırıldı.

## Self-Review Notları

- Spec'in her bölümü bir task'a bağlandı (model→T1/T3, motor→T5, kart→T7, admin→T9/T10, göç→T4, kampanya→T11, temizlik→T12/T13).
- `useCart` cart item'ına `categoryId` eklenmesi T8'de net (kapsam-kısmi için gerekli) — AddToCartButton sepete yazarken product.categoryId koymalı; ürün sayfası zaten category'yi biliyor.
- Tip tutarlılığı: `Promotion` tipi T2'de tanımlı, tüm task'lar onu kullanır. `validateCoupon` dönüşü T3/T5/T6'da aynı.
- Test gerçeği: jest yok → saf hesap node JS-kopya testi (T2), tip güvenliği tsc (her task), uçtan uca Supabase MCP+curl (T5) — mevcut proje deseni.
