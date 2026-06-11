# İndirim Modülü — Faz 1 Tasarımı (Düz Kapsamlı İndirimler)

**Tarih:** 2026-06-11
**Branch:** feat/ai-studyo-upscale
**Durum:** Tasarım onaylandı, uygulama planı bekliyor

## 1. Amaç ve Kapsam

Dağınık indirim/pazarlama parçalarını (ürün indirimi, kuponlar, sepet eşikli indirim, kampanyalar, duyuru bandı) **tek birleşik `promotions` modeli + tek hesap motoru + tek "İndirim" admin merkezi** altında topla. Her indirim **kapsam** seçebilsin: tüm ürünler / kategoriler / belirli ürünler. Kapsamlı indirim **kısmi** uygulanır (sadece eşleşen kalemler).

**Asıl odak:** ürünleri öne çıkarmak için otomatik (kartta görünen) ürün/kategori/tüm-ürün indirimleri; kuponlar müşterinin kodla faydalanması için.

### Faz 1 (bu spec)
- Birleşik `promotions` tablosu + kapsam join tabloları
- **Düz (flat)** indirimler: otomatik (item) + kupon (cart) + sepet-eşikli (cart auto)
- İki-katmanlı hesap motoru (sunucu otoritatif)
- Otomatik ürün/kategori indirimlerinin **ürün kartlarında** gösterimi
- Mevcut kupon/sepet-eşikli/ürün-indirimi **göçü**
- Tek "İndirim" admin sayfası + Kampanya'nın promotion'a bağlanması

### Faz dışı (sonraki spec'ler)
- **Faz 2:** Adet bazlı/BOGO (`deal_type='bogo'`: "3 al 2 öde", "2.ciye %X")
- **Faz 3:** Kampanya/promo keşif cilası (karşılama promo bandı vb.)

## 2. Veri Modeli

```
promotions
  id            text PK  DEFAULT (gen_random_uuid())::text
  name          text NOT NULL                       -- admin etiketi ("Tablolarda %20")
  trigger       text NOT NULL                        -- 'auto' | 'code'
  apply_level   text NOT NULL                        -- 'item' | 'cart'
  deal_type     text NOT NULL DEFAULT 'flat'         -- 'flat' (Faz1) | 'bogo' (Faz2)
  code          text UNIQUE                            -- yalnız trigger='code'
  scope         text NOT NULL DEFAULT 'all'           -- 'all' | 'products' | 'categories'
  value_type    text NOT NULL DEFAULT 'percentage'    -- 'percentage' | 'fixed'
  value         numeric NOT NULL
  min_subtotal  numeric                               -- koşul (sepet eşiği / kupon min)
  starts_at     timestamptz
  ends_at       timestamptz
  max_uses      integer
  used_count    integer NOT NULL DEFAULT 0
  first_order_only boolean NOT NULL DEFAULT false
  priority      integer NOT NULL DEFAULT 0
  is_active     boolean NOT NULL DEFAULT true
  created_at    timestamptz NOT NULL DEFAULT now()

promotion_products    (promotion_id text, product_id text,  PK(promotion_id, product_id))
promotion_categories  (promotion_id text, category_id text, PK(promotion_id, category_id))
```

`campaigns` tablosuna `promotion_id text` (FK, nullable) eklenir; `coupon_code` göç sonrası terk edilir (kolon kalır, kullanılmaz).

**Geçerlilik kuralları:**
- `apply_level='item'` → `trigger='auto'` (Faz 1'de item indirimleri yalnız otomatik; kartta sale gösterimi).
- `apply_level='cart'` + `trigger='code'` → kupon.
- `apply_level='cart'` + `trigger='auto'` → sepet eşikli (genelde scope=all + min_subtotal).
- `scope='all'` → tüm kalemler; `'products'`/`'categories'` → join tablolarındaki hedeflere eşleşen kalemler (kısmi).
- RLS açık, policy yok (uygulama service-role ile çalışır — proje deseni). `get_advisors(security)` ile doğrula.

## 3. Hesap Motoru (sunucu otoritatif)

İki katman:

**Katman A — Ürün indirimi (`apply_level='item'`, otomatik, kartta görünür):**
- Her kaleme **en iyi tek** eşleşen otomatik indirim (öncelik: ürün-kapsamlı > kategori > tüm; tarihi geçerli; eşitlikte en yüksek tutar, sonra `priority`).
- İki sale üst üste binmez. Sonuç = efektif birim fiyat (kartta üstü-çizili + sepet kalem fiyatı).
- Item promotion'larda `min_subtotal` kullanılmaz (sale = fiyat düşümü, sepet koşulu değil).

**Katman B — Sepet/kupon indirimi (`apply_level='cart'`):**
- **Kupon** (`trigger='code'`): kapsamına göre **kısmi** — sadece eşleşen kalemlerin (Katman A sonrası) tutarına. Koşullar: tarih, max_uses, first_order_only, min_subtotal.
- **Sepet eşikli** (`trigger='auto'`, min_subtotal): eşik aşılınca otomatik, kapsamına göre kısmi.
- Bu ikisinden **büyüğü** uygulanır (üst üste binmez).

**Akış (`/api/orders`, sunucuda yeniden hesap):**
1. Her kalem → Katman A en iyi otomatik → efektif birim fiyat
2. İndirimli ara toplam
3. Katman B = `max(geçerli kupon, geçerli sepet-eşikli)` (kapsam-kısmi, indirimli tutar üzerinden)
4. `total = indirimliAraToplam − katmanB + kargo`

**Sonuç:** Bir kaleme en fazla **2 indirim** biner (Katman A sale + Katman B kupon/eşik).

**Kenar durumlar:** süresi geçmiş/pasif/limit dolu/ilk-sipariş ihlali → atlanır. Kupon yalnız Katman B'yi kazanırsa `used_count` artar (cod'da inline, kartta PayTR callback'inde — kazanan kupon kodu `orders.discount_code`'a yazılır). Sepet-eşikli kazanırsa `discount_code=null`. İstemciden gelen fiyat/indirim GÜVENİLMEZ.

## 4. Ürün Kartı Gösterimi

- Kart efektif fiyatı = Katman A en iyi otomatik indirim (ürün **ve** kategori dahil).
- Katalog sayfaları zaten `unstable_cache`/ISR ile cache'li → aktif item-promotion'lar cache build'inde bir kez çekilir, her ürüne en iyi indirim uygulanır. Liste performansı korunur.
- Katman B (kupon/eşik) kartta görünmez; sepet/ödeme özetinde görünür + sepette "X₺ daha ekle" nudge (mevcut davranış korunur).

## 5. Admin IA — Tek "İndirim" Merkezi

**Menü:** `Kuponlar` + `Sepet İndirimi` → **tek `İndirim`** sayfası. `Kampanyalar` ve `Duyuru Bandı` kalır.

**İndirim sayfası:**
- Liste: Ad · Tür (Otomatik İndirim / Kupon / Sepet Eşikli) · Kapsam · Değer · Tarih · Kullanım · Durum (toggle). Türe göre filtre.
- "Yeni İndirim" formu: Ad · Tür (Otomatik=kartta / Kupon=kodlu) · Kapsam (Tüm / Kategoriler çoklu / Ürünler çoklu) · Değer tipi+değer · Tarih · (kupon: kod, min, max, ilk-sipariş; eşikli: min_subtotal) · öncelik · durum.
- Ürün editöründeki "bu ürüne indirim" kısayolu → ürün-kapsamlı otomatik promotion oluşturur/günceller.

**Kampanya formu:** `coupon_code` metni yerine **promotion seçici** (dropdown) → `promotion_id`.

## 6. Göç Planı (düşük risk — gerçek müşteri verisi yok)

1. Migration: `promotions` + `promotion_products` + `promotion_categories` + `campaigns.promotion_id`.
2. Veri göçü (idempotent SQL):
   - `coupons` → promotions(trigger=code, apply_level=cart, scope=all, alanlar map).
   - `cart_discount_tiers` (config.enabled'a saygıyla) → promotions(trigger=auto, apply_level=cart, scope=all, min_subtotal=eşik).
   - `products.discount_percent`(+tarih, aktif) → promotions(trigger=auto, apply_level=item, scope=products → o ürün).
   - `campaigns.coupon_code` → eşleşen promotion'ın `promotion_id`'si.
3. Cutover: `lib/promotions.ts` (yeni) + `lib/pricing.ts` (promotion-aware) okuma; eski kupon/sepet-indirim kod yolları kaldırılır; admin İndirim sayfası devreye; Kampanya formu promotion seçer.
4. Temizlik (sonraki migration): `coupons`, `cart_discount_tiers`, `cart_discount_config`, `products.discount_percent/_starts_at/_ends_at` DROP.

## 7. Dosya Planı

**Yeni:**
- `src/lib/promotionsCalc.ts` — saf hesap (client-safe): tipler, `bestItemDiscount`, `cartDiscount`, kapsam eşleştirme.
- `src/lib/promotions.ts` — server: cache'li `getActiveItemPromotions()` / `getActiveCartPromotions()` / `validateCoupon()` (tag `promotions`).
- `src/app/api/promotions/route.ts` — public (kart/sepet için aktif item+cart promotion'lar).
- `src/app/api/admin/promotions/route.ts` + `/[id]/route.ts` — admin CRUD.
- `src/app/admin/indirim/page.tsx` — tek İndirim yönetim sayfası.

**Değişen:**
- `src/app/api/orders/route.ts` — yeni iki-katmanlı motor.
- `src/app/api/coupons/validate/route.ts` — promotions üzerinden kupon doğrulama (kapsam-aware).
- `src/lib/pricing.ts` — kart efektif fiyatı promotion-aware.
- Katalog sorguları (`lib/catalog` + ürün kartı tüketicileri) — aktif item-promotion'ları cache'te uygula.
- `src/app/(shop)/sepet/page.tsx` + `odeme/CheckoutClient.tsx` — kapsam-kısmi indirim gösterimi.
- `src/app/admin/layout.tsx` — menü: Kuponlar+Sepet İndirimi → İndirim.
- `src/app/admin/kampanyalar/CampaignForm.tsx` + campaigns API — promotion seçici.
- Ürün editörü — "bu ürüne indirim" kısayolu promotion'a yazar.

**Kaldırılacak (cutover sonrası):** `admin/kuponlar`, `admin/sepet-indirimi`, `lib/coupons.ts`, `lib/cartDiscount.ts`, `lib/cartDiscountCalc.ts`, `api/cart-discount*`, `api/admin/cart-discount*`, `api/admin/coupons*` (promotions'a taşınır).

## 8. Uygulama Sırası

1. Tablolar + RLS + advisor doğrulama.
2. `promotionsCalc.ts` (saf) + birim test (node).
3. `promotions.ts` (server getter'lar + validateCoupon).
4. Veri göçü SQL (idempotent) — mevcut test verisi taşınır.
5. `/api/orders` motor cutover + node testleri (katman A/B, kısmi, max).
6. Kart fiyatı promotion-aware (katalog cache).
7. Admin İndirim sayfası + API.
8. Kampanya formu promotion seçici.
9. Sepet/ödeme gösterim.
10. Eski yolların kaldırılması + menü güncelleme.
11. Eski tablo/kolon DROP (ayrı migration, en son).

## 9. Test

- **Saf hesap (node):** bestItemDiscount (ürün>kategori>tüm), kısmi kupon, max(kupon, eşik), kapsam eşleştirme, tarih/koşul filtreleri.
- **Canlı (Supabase MCP + curl, preview):** göç sonrası bir sentetik promotion ile `/api/orders` ve `/api/promotions` doğrulama (gerçek veri yok, güvenli).
- `tsc --noEmit` her adımda temiz.

## 10. Açık Notlar

- Faz 1'de `apply_level='item'` yalnız `trigger='auto'`. Kodlu ürün-indirimi (kupon ama kartta sale gibi) Faz dışı.
- `priority` Faz 1'de yalnız eşitlik tie-break; gelişmiş çakışma kuralları gerekirse sonra.
- BOGO alanları (`buy_quantity`/`get_quantity`/`get_percent`) Faz 2 migration'ında eklenir — model bugünden uyumlu.
