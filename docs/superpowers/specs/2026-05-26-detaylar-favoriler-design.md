# Tasarım Spesifikasyonu: Ürün Detaylar Tab'ı + Favoriler

**Tarih:** 2026-05-26  
**Durum:** Onaylandı  

---

## Özet

İki bağımsız özellik ekleniyor. Mevcut ürün sayfası yapısı (ProductGallery, AddToCartButton, varyant sistemi) hiç değişmiyor; her şey bu yapının üzerine ekleniyor.

---

## 1. Ürün Detaylar Tab'ı

### Amaç
Her ürün için kağıt kalitesi, baskı tekniği gibi teknik bilgileri kullanıcıya göstermek. Admin bu bilgileri ürün düzenleme sayfasından girer.

### Veritabanı

`products` tablosuna nullable bir kolon eklenir:

```sql
ALTER TABLE products ADD COLUMN details JSONB;
```

`details` içindeki sabit alanlar (tüm alanlar opsiyonel, boş bırakılabilir):

```json
{
  "paper_quality": "Parlak 250gr",
  "print_technique": "Dijital ofset",
  "surface_finish": "Mat laminasyon",
  "delivery_days": "2-3 iş günü",
  "dimensions_note": "10×15 cm, 13×18 cm seçenekleri"
}
```

### Ürün Sayfası — UI

Mevcut iki sütunlu layout (`ProductGallery` sol + bilgi sağ) **değişmez**. Bu bloğun **altına** tab bölümü eklenir:

```
[  Ürün Detayları  ] [  Müşteri Yorumları  ]
──────────────────────────────────────────
  Kağıt Kalitesi    Parlak 250gr
  Baskı Tekniği     Dijital ofset
  Yüzey             Mat laminasyon
  Üretim Süresi     2-3 iş günü
  Boyut Notu        10×15 cm, 13×18 cm
```

- `details` kolonu null veya tüm alanlar boşsa tab bölümü hiç render edilmez
- Yorumlar tab'ı şimdilik "Yakında" placeholder gösterir
- Tab state client component — `useState` ile, SSR karmaşıklığı yok

### Admin — Ürün Düzenleme

`/admin/urunler/[id]/duzenle` sayfasında mevcut form alanlarının altına "Ürün Detayları" bölümü eklenir. 5 text input, her biri optional. Kaydetmek mevcut PATCH API'sine `details` alanı eklenerek yapılır.

### Etkilenen Dosyalar
- `prisma/schema.prisma` — `details Json?` alanı
- `src/app/(shop)/urunler/[slug]/page.tsx` — tab bölümü eklenir (alt kısma)
- `src/app/admin/urunler/[id]/duzenle/page.tsx` — details form alanları
- `src/app/api/admin/products/[id]/route.ts` — PATCH'e details dahil edilir

---

## 2. Favoriler

### Amaç
Kullanıcı beğendiği ürünleri favorilere ekleyip `/favorilerim` sayfasından görebilsin. Giriş yapmayan kullanıcı ♡ tıklarsa `/giris` sayfasına yönlendirilir.

### Veritabanı

```sql
CREATE TABLE favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);
```

### API

**`POST /api/favorites`** — favori ekle  
Body: `{ productId: string }`  
- Auth zorunlu (giriş yoksa 401)
- Zaten favorideyse 200 döner (idempotent)

**`DELETE /api/favorites`**  
Body: `{ productId: string }`  
- Auth zorunlu

### UI — ♡ Butonu (2 Yerde)

**1. Ürün listesi kartları (`ProductCard`)**  
Kart sağ üst köşesinde, her zaman görünür küçük ikon. Dolu ♥ = favoride, boş ♡ = değil. Optimistic update — API yanıtı beklemeden UI güncellenir, hata olursa geri alınır.

**2. Ürün detay sayfası (`AddToCartButton` yanında)**  
"Sepete Ekle" / "Fotoğrafları Yükle" butonunun yanına pill şeklinde ♡ butonu eklenir. AddToCartButton'ın mevcut prop'ları ve logic'i değişmez; yeni `isFavorited` ve `productId` prop'ları eklenir.

### `/favorilerim` Sayfası

- Route: `src/app/(shop)/favorilerim/page.tsx`
- Auth korumalı — giriş yoksa `/giris?redirect=/favorilerim`
- Ürün kartlarını mevcut `ProductCard` bileşeniyle grid olarak gösterir
- Her kartta ♥ ikonu var, tıklanınca favoriden çıkar ve listeden kalkar

### Profil Navigasyonu

Mevcut `/profil` sayfasındaki navigasyon linklerine "Favorilerim" eklenir.

### Önemli: ProductCard Çıkarımı

Şu an ürün kartları `src/app/(shop)/urunler/page.tsx` içinde inline yazılmış — ayrı bir bileşen yok. ♡ butonunun optimistic update yapabilmesi için kart bir client component olmalı. Bu yüzden:

1. Kart kodu `src/components/product/ProductCard.tsx` client component'e taşınır
2. `urunler/page.tsx` bu bileşeni kullanır
3. Kart içinde `<Link>` wrapping korunur; ♡ butonu `e.stopPropagation()` ile Link navigasyonunu engeller
4. İlk favori durumu `urunler/page.tsx`'de server-side fetch ile alınır, prop olarak geçilir

### API Notları

Favori route'larında DECISIONS.md mimarisi uygulanır:
- Auth kontrolü: `createClient()` ile `getUser()`
- DB işlemleri: `createAdminClient()` ile (RLS bypass)

### Etkilenen Dosyalar
- `prisma/schema.prisma` — `Favorite` modeli
- `src/app/api/favorites/route.ts` — POST / DELETE handler (yeni)
- `src/components/product/ProductCard.tsx` — kart buraya taşınır, ♡ ikonu eklenir (yeni dosya)
- `src/app/(shop)/urunler/page.tsx` — ProductCard import eder, favori ID'lerini server'da çeker
- `src/app/(shop)/urunler/[slug]/AddToCartButton.tsx` — `isFavorited: boolean` prop eklenir, mevcut logic korunur
- `src/app/(shop)/urunler/[slug]/page.tsx` — favori durumu server'da çekilip AddToCartButton'a geçilir
- `src/app/(shop)/favorilerim/page.tsx` — yeni sayfa
- `src/app/(shop)/profil/page.tsx` — nav linki eklenir

---

## Kapsam Dışı

- Sepette "Sonra Al" akışı — bu spekte yok
- Favoriler bildirimi / e-posta — yok
- Favori sayısı gösterimi admin panelinde — yok
- Yorumlar tab'ı implementasyonu — sadece placeholder, gerçek yorum sistemi ayrı sprint
