export const metadata = { title: "Mesafeli Satış Sözleşmesi | AnıBaskı" };

export default function MesafeliSatisSozlesmesiPage() {
  return (
    <article>
      <h1>Mesafeli Satış Sözleşmesi</h1>
      <p className="text-xs text-text-light">Son güncelleme: Ocak 2026</p>

      <h2>MADDE 1 — TARAFLAR</h2>
      <p>
        <strong>Satıcı:</strong> AnıBaskı<br />
        <strong>Adres:</strong> [ŞİRKET ADRESİ]<br />
        <strong>E-posta:</strong> destek@anibaski.com<br />
        <strong>Vergi No:</strong> [VERGİ NO]
      </p>
      <p>
        <strong>Alıcı:</strong> Sipariş sırasında sisteme kayıtlı ad/soyad ve adres bilgilerini kullanan müşteri.
      </p>

      <h2>MADDE 2 — KONU</h2>
      <p>
        İşbu sözleşme, Alıcı&apos;nın Satıcı&apos;ya ait <strong>anibaski.com</strong> web sitesi üzerinden
        elektronik ortamda sipariş verdiği, aşağıda nitelikleri ve satış fiyatı belirtilen ürünün satışı ve
        teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler
        Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerini düzenlemektedir.
      </p>

      <h2>MADDE 3 — SÖZLEŞME KONUSU ÜRÜN</h2>
      <p>
        Ürünün temel nitelikleri, satış fiyatı ve ödeme bilgileri sipariş özet sayfasında ve onay
        e-postasında yer almaktadır. Ürünler kişiye özel üretilmekte olup temel nitelikler her sipariş için
        farklılık gösterebilir.
      </p>

      <h2>MADDE 4 — TESLİMAT</h2>
      <ul>
        <li>Teslimat adresi olarak Alıcı&apos;nın sipariş sırasında belirttiği adres esas alınır.</li>
        <li>Kişiye özel ürünlerin hazırlanma süresi <strong>2–5 iş günü</strong>dür.</li>
        <li>Kargo süresi seçilen kargo firmasına göre <strong>1–3 iş günü</strong>dür.</li>
        <li>Stok dışı ya da beklenmedik durumlarda Alıcı bilgilendirilir.</li>
        <li>Teslimat riski kargoya teslimle birlikte Alıcı&apos;ya geçer.</li>
      </ul>

      <h2>MADDE 5 — ÖDEME</h2>
      <p>
        Ödeme, sipariş sırasında seçilen yöntemle (kredi/banka kartı veya kapıda ödeme) gerçekleştirilir.
        Kredi kartı işlemleri PCI-DSS uyumlu ödeme altyapısı (PayTR) üzerinden yürütülür; kart bilgileri
        Satıcı tarafından saklanmaz.
      </p>

      <h2>MADDE 6 — CAYMA HAKKI</h2>
      <p>
        Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesi (f) bendi
        uyarınca, <strong>tüketicinin istekleri veya açıkça onun kişisel ihtiyaçları doğrultusunda
        hazırlanan mallarda</strong> cayma hakkı kullanılamaz.
      </p>
      <p>
        AnıBaskı&apos;da sunulan tüm ürünler kişiye özel fotoğraflarla üretildiğinden, teslimattan sonra
        cayma hakkı geçerli değildir.
      </p>
      <p>
        Bununla birlikte, Satıcı kendi inisiyatifiyle sipariş <strong>Beklemede</strong> aşamasındayken
        iptal taleplerini değerlendirmektedir. Detaylar için{" "}
        <a href="/politikalar/iptal-iade">İptal ve İade Politikası</a>&apos;na bakınız.
      </p>

      <h2>MADDE 7 — GİZLİLİK</h2>
      <p>
        Alıcı&apos;ya ait kişisel veriler KVKK kapsamında işlenmekte ve korunmaktadır.
        Detaylar için <a href="/politikalar/gizlilik">Gizlilik Politikası</a>&apos;na bakınız.
      </p>

      <h2>MADDE 8 — UYUŞMAZLIKLARIN ÇÖZÜMÜ</h2>
      <p>
        İşbu sözleşmeden doğabilecek uyuşmazlıklarda öncelikle Satıcı müşteri hizmetleri kanalları
        kullanılmalıdır. Çözüme kavuşturulamazsa ilgili İl/İlçe Tüketici Hakem Heyeti&apos;ne veya Tüketici
        Mahkemesi&apos;ne başvurulabilir.
      </p>

      <h2>MADDE 9 — YÜRÜRLÜK</h2>
      <p>
        Alıcı, sipariş tamamlama adımında &quot;Mesafeli Satış Sözleşmesi&apos;ni okudum ve kabul ediyorum&quot;
        onayını vererek işbu sözleşmeyi kabul etmiş sayılır. Sözleşme, ödemenin onaylanmasıyla yürürlüğe girer.
      </p>
    </article>
  );
}
