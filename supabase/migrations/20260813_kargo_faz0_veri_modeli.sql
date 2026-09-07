-- Kargo Faz 0 — sağlayıcıdan bağımsız veri modeli
-- Tarih: 2026-08-13 · Dayanak: KARGO_ARASTIRMA.md §7 + ARAS_KARGO_ARASTIRMA.md §2.4
--
-- Bu migration HİÇBİR sağlayıcı kararına bağlı değildir. Aras, Geliver, Basit Kargo —
-- hangisi seçilirse seçilsin bu alanlar gerekir (üç sağlayıcıda da doğrulandı).
--
-- Uygulama: Supabase SQL Editor'de tek seferde çalıştır. Tekrar çalıştırılabilir (idempotent).

-- ---------------------------------------------------------------------------
-- 1) products — paketlenmiş ürün ölçüleri (desi hesabı için)
-- ---------------------------------------------------------------------------
-- ⚠️ Ölçüler ürünün değil, PAKETLENMİŞ hâlinin ölçüsüdür (ambalaj + koruyucu dahil).
-- Desi = (En × Boy × Yükseklik) / 3000 · faturalanan = desi ile kg'ın büyüğü.
-- Büyük formatta maliyet ağırlıktan değil boyuttan gelir (50×70×5 cm ≈ 5,8 desi).

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS length_cm NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS width_cm  NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(6,3);

COMMENT ON COLUMN products.length_cm IS 'Paketlenmiş en (cm) — ambalaj dahil';
COMMENT ON COLUMN products.width_cm  IS 'Paketlenmiş boy (cm) — ambalaj dahil';
COMMENT ON COLUMN products.height_cm IS 'Paketlenmiş yükseklik (cm) — ambalaj dahil';
COMMENT ON COLUMN products.weight_kg IS 'Paketlenmiş ağırlık (kg) — ambalaj dahil';

-- ---------------------------------------------------------------------------
-- 2) addresses — il plaka kodu
-- ---------------------------------------------------------------------------
-- Taşıyıcı API'leri il'i serbest metin değil KOD bekliyor:
--   Aras GetPriceCalculation → gonderici_ilkodu / alici_ilkodu
--   Aras SetOrder            → CityCode
--   Agregatörler             → state_id
-- NOT: `zip` kolonu zaten mevcut, eklenmiyor.

ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS city_code TEXT;

COMMENT ON COLUMN addresses.city_code IS 'İl plaka kodu, iki haneli ("34"). lib/shipping/cities.ts ile eşlenir.';

-- Mevcut serbest metin il adlarını en iyi çabayla koda bağla.
-- Türkçe duyarlı normalize: İ/I/ı → i, aksanlar sadeleştirilir, boşluk/nokta atılır.
WITH il AS (
  SELECT * FROM (VALUES
    ('01','Adana'),('02','Adıyaman'),('03','Afyonkarahisar'),('04','Ağrı'),('05','Amasya'),
    ('06','Ankara'),('07','Antalya'),('08','Artvin'),('09','Aydın'),('10','Balıkesir'),
    ('11','Bilecik'),('12','Bingöl'),('13','Bitlis'),('14','Bolu'),('15','Burdur'),
    ('16','Bursa'),('17','Çanakkale'),('18','Çankırı'),('19','Çorum'),('20','Denizli'),
    ('21','Diyarbakır'),('22','Edirne'),('23','Elazığ'),('24','Erzincan'),('25','Erzurum'),
    ('26','Eskişehir'),('27','Gaziantep'),('28','Giresun'),('29','Gümüşhane'),('30','Hakkâri'),
    ('31','Hatay'),('32','Isparta'),('33','Mersin'),('34','İstanbul'),('35','İzmir'),
    ('36','Kars'),('37','Kastamonu'),('38','Kayseri'),('39','Kırklareli'),('40','Kırşehir'),
    ('41','Kocaeli'),('42','Konya'),('43','Kütahya'),('44','Malatya'),('45','Manisa'),
    ('46','Kahramanmaraş'),('47','Mardin'),('48','Muğla'),('49','Muş'),('50','Nevşehir'),
    ('51','Niğde'),('52','Ordu'),('53','Rize'),('54','Sakarya'),('55','Samsun'),
    ('56','Siirt'),('57','Sinop'),('58','Sivas'),('59','Tekirdağ'),('60','Tokat'),
    ('61','Trabzon'),('62','Tunceli'),('63','Şanlıurfa'),('64','Uşak'),('65','Van'),
    ('66','Yozgat'),('67','Zonguldak'),('68','Aksaray'),('69','Bayburt'),('70','Karaman'),
    ('71','Kırıkkale'),('72','Batman'),('73','Şırnak'),('74','Bartın'),('75','Ardahan'),
    ('76','Iğdır'),('77','Yalova'),('78','Karabük'),('79','Kilis'),('80','Osmaniye'),
    ('81','Düzce'),
    -- halk arasında kullanılan eski/kısa adlar
    ('03','Afyon'),('33','İçel'),('46','Maraş'),('63','Urfa'),('27','Antep')
  ) AS t(code, name)
),
norm AS (
  SELECT code,
         regexp_replace(
           translate(lower(replace(replace(name,'İ','i'),'I','i')),
                     'ışğüöçâ', 'isguoca'),
           '[\s._-]', '', 'g') AS key
  FROM il
)
UPDATE addresses a
SET city_code = n.code
FROM norm n
WHERE a.city_code IS NULL
  AND a.city IS NOT NULL
  AND regexp_replace(
        translate(lower(replace(replace(a.city,'İ','i'),'I','i')),
                  'ışğüöçâ', 'isguoca'),
        '[\s._-]', '', 'g') = n.key;

-- ---------------------------------------------------------------------------
-- 3) orders — kargo gönderi alanları
-- ---------------------------------------------------------------------------
-- Şu an yalnızca `trackingCode` var (admin elle yapıştırıyor): hangi taşıyıcıyla
-- gittiği DB'de tutulmuyor ve müşteriye takip LİNKİ verilemiyor.
-- NOT: yeni kolonlar snake_case — son eklenen kolonlarla tutarlı
-- (discount_amount, deliveredAt gibi eski camelCase ikizler korunuyor).

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS carrier      TEXT,
  ADD COLUMN IF NOT EXISTS shipment_id  TEXT,
  ADD COLUMN IF NOT EXISTS label_url    TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url TEXT;

COMMENT ON COLUMN orders.carrier      IS 'Taşıyıcı kimliği (ör. "aras"). Sağlayıcı/taşıyıcı değişse de geçmiş sipariş okunabilir kalsın diye metin.';
COMMENT ON COLUMN orders.shipment_id  IS 'Taşıyıcı/sağlayıcı tarafındaki gönderi kimliği — durum yoklaması bununla yapılır';
COMMENT ON COLUMN orders.label_url    IS 'Kargo etiketi (PDF) bağlantısı';
COMMENT ON COLUMN orders.tracking_url IS 'Müşteriye gösterilecek takip bağlantısı (çıplak kod değil)';

-- ---------------------------------------------------------------------------
-- Doğrulama — çalıştırdıktan sonra bunları kontrol et
-- ---------------------------------------------------------------------------
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'products' AND column_name IN ('length_cm','width_cm','height_cm','weight_kg');
-- SELECT count(*) FILTER (WHERE city_code IS NOT NULL) AS eslesen,
--        count(*) FILTER (WHERE city_code IS NULL)     AS eslesmeyen FROM addresses;
-- SELECT DISTINCT city FROM addresses WHERE city_code IS NULL;  -- elle düzeltilecekler
