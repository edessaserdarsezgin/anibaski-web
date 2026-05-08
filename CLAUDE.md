# AnıBaskı — Fotoğraf Baskı E-Ticaret Projesi

## Proje Özeti

Dijital anıları fotoğraf baskısı, fotokitap, tablo, polaroid ve kişisel hediyelere dönüştüren e-ticaret platformu.

**Mevcut Durum:** Next.js 16 projesi kuruldu — `C:\Users\edessa\Desktop\Web\anibaski-web`  
**Prototip:** Statik HTML/CSS/JS referans olarak `_prototype/` klasöründe  
**Hedef:** Tam yığın Next.js uygulaması (aşağıdaki teknoloji yığını ile)

---

## Teknoloji Yığını

| Katman | Teknoloji | Amaç |
|---|---|---|
| Frontend | Next.js 16 (App Router) | Sayfa yönlendirme, SSR/SSG/ISR |
| Stil | Tailwind CSS | Utility-first CSS |
| Auth | Supabase Auth | Kullanıcı oturum yönetimi |
| Veritabanı | PostgreSQL (Supabase) | Ana veri depolama |
| Dosya Depolama | Supabase Storage → Cloudflare R2 | Başlangıçta Supabase, yüksek trafikte R2'ye geç |
| ORM | Prisma | Veritabanı şema ve sorguları (Prisma Studio + migration) |
| Ödeme | PayTR + İyzico | Türkiye pazarı; PayTR düşük komisyon, İyzico olgun API |

---

## Sistem Modülleri

### 1. Kategoriler
- Kategoriler DB'den çekilir, dinamik route ile listelenir
- `/kategoriler/[slug]` — kategoriye göre ürün listeleme

### 2. Ürünler
- `/urunler` — tüm ürünleri listele (filtreleme, sıralama)
- `/urunler/[slug]` — ürün detayı (galeri, varyantlar, fotoğraf yükleme)
- Varyant tipleri: `select` (boyut, sayfa sayısı), `radio` (renk, malzeme)
- Fiyat add-on sistemi (varyant seçimine göre fiyat güncelleme)

### 3. Sepet
- `/sepet` — sepet içeriği, adet güncelleme, çıkarma
- Supabase'de kullanıcıya bağlı sepet (oturum açıksa) veya `localStorage` (anonim)
- Checkout öncesi sepet özeti

### 4. Ödeme
- `/odeme` — teslimat formu + ödeme seçimi
- Kapıda ödeme seçeneği (+30 ₺ ek ücret)
- Ödeme entegrasyonu: İyzico veya Stripe (TBD)

### 5. Siparişler
- `/siparisler` — kullanıcının sipariş geçmişi
- `/siparisler/[id]` — sipariş detayı + durum takibi
- Durum akışı: `Beklemede → Hazırlanıyor → Kargoda → Teslim Edildi`

### 6. Admin Paneli
- `/admin` — korumalı route (admin rolü gerekli)
- Ürün CRUD, kategori yönetimi, sipariş yönetimi, kullanıcı listesi

### 7. Kullanıcı Girişi
- `/giris` — Supabase Auth ile e-posta + şifre girişi
- `/kayit` — yeni kullanıcı kaydı
- Sosyal giriş (Google) opsiyonel

---

## Veritabanı Şeması (PostgreSQL)

```sql
-- Kategoriler
categories (id, name, slug, description, image_url, created_at)

-- Ürünler
products (id, category_id, name, slug, description, base_price, images[], specs jsonb, created_at)

-- Varyantlar
product_variants (id, product_id, type, label, value, price_addon)

-- Kullanıcılar (Supabase Auth ile sync)
profiles (id, email, full_name, phone, role, created_at)

-- Adresler
addresses (id, user_id, title, full_name, phone, address, city, district, zip)

-- Sepet
cart_items (id, user_id, product_id, variant_selections jsonb, quantity, uploaded_image_url)

-- Siparişler
orders (id, user_id, address_id, status, payment_method, subtotal, shipping_fee, total, created_at)
order_items (id, order_id, product_id, variant_selections jsonb, quantity, unit_price, uploaded_image_url)
```

---

## Cloudflare R2 Kullanımı

- Ürün görselleri: `products/{product_id}/{filename}`
- Kullanıcı yüklenen fotoğraflar: `uploads/{user_id}/{order_id}/{filename}`
- Yükleme: Presigned URL ile direkt R2'ye upload (Next.js API route üzerinden token alınır)

---

## Mevcut Tasarım Sistemi (Tailwind config'e taşınacak)

```
primary:   #e07a5f  (terracotta — CTA, fiyat, vurgu)
bg:        #fdfbf7  (sıcak beyaz)
text:      #3d405b  (koyu lacivert-gri)
secondary: #8187a2  (ikincil metin)
accent:    #f2cc8f  (altın sarısı — badge)
border:    #ece8e1
font-serif: Lora    (başlıklar, logo)
font-sans:  Nunito  (gövde)
```

---

## Geliştirme Kuralları

### Kod Yazım Prensipleri (Karpathy Guidelines)
- Sadece istenen özelliği yaz, spekülatif kod ekleme
- Cerrahi değişiklikler: sadece gereken satırları değiştir
- Olmayan senaryolar için error handling yazma
- Her değişiklik önce CLAUDE.MD'ye sonra git'e işlenir

### Klasör Yapısı (Next.js App Router)
```
src/
├── app/
│   ├── (auth)/giris/
│   ├── (auth)/kayit/
│   ├── (shop)/kategoriler/[slug]/
│   ├── (shop)/urunler/
│   ├── (shop)/urunler/[slug]/
│   ├── (shop)/sepet/
│   ├── (shop)/odeme/
│   ├── (shop)/siparisler/
│   └── admin/
├── components/
│   ├── ui/          (Button, Input, Modal, vb.)
│   ├── product/     (ProductCard, ProductGallery, vb.)
│   ├── cart/        (CartItem, CartSummary, vb.)
│   └── layout/      (Header, Footer, Sidebar)
├── lib/
│   ├── supabase/    (client, server, middleware)
│   ├── r2/          (upload helpers)
│   └── db/          (Prisma queries)
└── types/
```

### Git Kuralları
- Her özellik değişikliği commit'lenir
- Commit mesajı: `feat:`, `fix:`, `chore:` prefix'i
- CLAUDE.MD güncel tutulur — her yeni karar buraya eklenir

---

## Kullanılan Yetenekler (Skills) ve MCP'ler

### Skills
- `andrej-karpathy-skills:karpathy-guidelines` — kod yazım prensipleri
- `refero-design` — UI tasarımı için referans araştırma
- `figma:figma-implement-design` — Figma → kod dönüşümü (gerekirse)

### MCP Sunucuları
- `Context7` — Next.js, Supabase, Tailwind, Prisma güncel dokümantasyon sorgulama
- `Vercel` — deployment ve log yönetimi

---

## Geliştirme Günlüğü

### ✅ 2026-05-08 — Altyapı Kurulumu
- Next.js 16 projesi oluşturuldu (`create-next-app`)
- Tailwind CSS, Prisma, `@supabase/ssr`, `@supabase/supabase-js` kuruldu
- `src/lib/supabase/client.ts` — browser client
- `src/lib/supabase/server.ts` — server component client (cookie tabanlı)
- `src/middleware.ts` — oturum yönetimi, korumalı rotalar (`/siparisler`, `/odeme`, `/admin`)
- `src/lib/db/prisma.ts` — Prisma client (PgBouncer adapter)
- `prisma/schema.prisma` — tam şema (Category, Product, ProductVariant, Profile, Address, CartItem, Order, OrderItem)
- Ana sayfa statik olarak oluşturuldu (Header, Footer, Hero, Kategori kartları, Özellikler)
- `(shop)` layout group oluşturuldu

### ✅ 2026-05-08 — Supabase Proje Kurulumu
- Eski `ai-tools-saas` projesi yerine `anibaski-web` adında yeni proje açıldı
- Bölge: `eu-central-1` (Frankfurt — Türkiye'ye en yakın mevcut bölge)
- Tüm tablolar MCP üzerinden `apply_migration` ile oluşturuldu
- Seed verisi eklendi: 4 kategori, 2 örnek ürün
- `.env.local` yeni proje URL ve key'leriyle güncellendi
- Supabase MCP `~/.claude.json` user scope'una eklendi (her oturumda aktif)
- `prisma generate` çalıştırıldı, Prisma Client güncellendi

---

## Sıradaki Adımlar (Öncelik Sırası)

- [ ] `/giris` + `/kayit` — Supabase Auth ile e-posta/şifre girişi
- [ ] `/kategoriler/[slug]` — DB'den kategoriye göre ürün listeleme
- [ ] `/urunler` — tüm ürünleri listele
- [ ] `/urunler/[slug]` — ürün detay sayfası (galeri, varyantlar, fotoğraf yükleme)
- [ ] `/sepet` — sepet yönetimi (oturum açık: DB, anonim: localStorage)
- [ ] `/odeme` — teslimat formu + ödeme seçimi
- [ ] `/siparisler` + `/siparisler/[id]` — sipariş geçmişi ve detayı
- [ ] `/admin` — ürün/kategori/sipariş yönetimi (admin rolü korumalı)
- [ ] UI bileşenleri (`ui/`, `product/`, `cart/`)
- [ ] Supabase Storage → R2 upload (presigned URL)

---

## Eksikler / Kararlar Bekleyen Konular

- [x] Ödeme altyapısı: **PayTR + İyzico** (yalnızca Türkiye pazarı, uluslararası genişleme yok)
- [ ] Kargo entegrasyonu: PTT Kargo, Yurtiçi, vs. tracking API
- [ ] E-posta bildirimleri: Sipariş onayı, kargo takip (Resend veya Supabase Edge Functions)
- [ ] SEO: `next-sitemap`, og:image için dinamik görsel üretimi
- [ ] Rate limiting: Yükleme endpoint'lerine (R2 presigned URL) abuse koruması
- [ ] NotebookLM e-ticaret araştırması: Kullanıcı referans araştırma notlarını buraya ekleyecek
