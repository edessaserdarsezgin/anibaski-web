import FaqCategory, { type FaqItem } from "@/components/faq/FaqCategory";

export const metadata = { title: "Sıkça Sorulan Sorular | AnıBaskı" };

const CATEGORIES: { id: string; title: string; items: FaqItem[] }[] = [
  {
    id: "siparis-odeme",
    title: "Sipariş & Ödeme",
    items: [
      { q: "Nasıl sipariş veririm?", a: <>Ürünü seçin, kişiye özelse fotoğraf(lar)ınızı yükleyin, sepete ekleyip ödemeyi tamamlayın. Yüklediğiniz fotoğraf doğrudan baskıya gider.</> },
      { q: "Hangi ödeme yöntemleri var?", a: <>Kredi/banka kartı ile güvenli ödeme (PayTR altyapısı) ve uygun ürünlerde kapıda ödeme. Kapıda ödemede küçük bir hizmet bedeli eklenir.</> },
      { q: "İndirim kuponunu nasıl kullanırım?", a: <>Sepet/ödeme adımında kupon kodunuzu girip uygulayın; indirim toplama yansır. Kuponun minimum tutar veya son kullanma koşulları olabilir.</> },
      { q: "Siparişimi nasıl takip ederim?", a: <>Üyeyseniz <a href="/siparisler">Siparişlerim</a>'den durumu (Hazırlanıyor / Kargoda / Teslim) ve kargo takip kodunu görürsünüz; ayrıca e-posta ve WhatsApp ile bilgilendirilirsiniz.</> },
      { q: "Sipariş onayını nasıl alırım?", a: <>Ödeme onaylanınca e-posta (ve telefonu olan üyelere WhatsApp) ile sipariş özeti gönderilir.</> },
    ],
  },
  {
    id: "kargo-teslimat",
    title: "Kargo & Teslimat",
    items: [
      { q: "Teslimat ne kadar sürer?", a: <>Hafta içi 14:00'a kadar verilen siparişler aynı gün üretime alınır. Üretim ve kargo süreleri ürün detayında ve <a href="/teslimat">Teslimat</a> sayfasında güncel gösterilir.</> },
      { q: "Kargo ücreti ne kadar, ücretsiz kargo var mı?", a: <>Güncel kargo ücreti ve ücretsiz kargo eşiği <a href="/teslimat">Teslimat</a> sayfasında ve sepette gösterilir; eşik ve üzeri siparişlerde kargo ücretsizdir.</> },
      { q: "Kargomu nasıl takip ederim?", a: <>Siparişiniz kargoya verildiğinde takip kodu <a href="/siparisler">Siparişlerim</a>'de görünür ve bildirim gönderilir.</> },
      { q: "Türkiye geneli gönderim var mı?", a: <>Evet, Türkiye'nin her yerine gönderim yapıyoruz.</> },
    ],
  },
  {
    id: "fotograf-baski",
    title: "Fotoğraf & Baskı Kalitesi",
    items: [
      { q: "Fotoğrafım baskı için yeterli kalitede mi?", a: <>En iyi sonuç için net ve yüksek çözünürlüklü fotoğraflar öneririz. Düşük çözünürlüklü fotoğraflarınızı <a href="/studyo">AI Stüdyo</a> ile netleştirip büyütebilirsiniz.</> },
      { q: "Hangi dosya formatları destekleniyor?", a: <>Yaygın görüntü formatları (JPG, PNG vb.) yüklenebilir.</> },
      { q: "Kaç fotoğraf yüklemem gerekir?", a: <>Ürüne göre değişir; kişiye özel ürünlerde gereken fotoğraf adedi ürün sayfasında belirtilir.</> },
      { q: "Fotoğraflarım nasıl saklanıyor?", a: <>Yüklediğiniz fotoğraflar yalnızca siparişinizin üretimi için kullanılır.</> },
    ],
  },
  {
    id: "ai-studyo",
    title: "AI Stüdyo & Krediler",
    items: [
      { q: "AI Stüdyo nedir?", a: <>Fotoğraflarınızı baskı öncesi netleştirip büyütmenize ve efekt uygulamanıza yarayan yapay zeka aracıdır (<a href="/studyo">AI Stüdyo</a>).</> },
      { q: "Kullanmak için üye olmam gerekir mi?", a: <>Evet; araçları kullanmak için giriş yapmanız gerekir. Galeriye herkes göz atabilir.</> },
      { q: "Ücretsiz mi?", a: <>Her üyeye ücretsiz deneme hakkı tanımlanır. İlk baskı siparişinizden sonra her gün ücretsiz kredi kazanmaya başlarsınız.</> },
      { q: "Kredileri nasıl kazanırım?", a: <>Günlük ücretsiz hakların yanı sıra, baskı siparişlerinizle (belirli tutar eşiğinde) ek kredi kazanırsınız.</> },
      { q: "Kredilerim dolunca ne olur?", a: <>Yeni bir baskı siparişiyle kredi kazanırsınız; ileride ücretli kredi paketi seçeneği de eklenecek.</> },
    ],
  },
  {
    id: "iptal-iade",
    title: "İptal & İade",
    items: [
      { q: "Siparişimi iptal edebilir miyim?", a: <>Üretim başlamadan iptal talebi oluşturabilirsiniz. Detaylar: <a href="/politikalar/iptal-iade">İptal ve İade</a>.</> },
      { q: "İade veya cayma hakkım var mı?", a: <>Standart ürünlerde yasal cayma hakkı geçerlidir. Kişiye özel (fotoğraflı / üretime girmiş) ürünlerde cayma hakkı istisnası uygulanır.</> },
      { q: "Hatalı veya hasarlı ürün gelirse ne olur?", a: <>Üretim veya kargo kaynaklı hatalarda yeniden üretim ya da iade yapılır; <a href="/iletisim">İletişim</a>'den bize ulaşın.</> },
    ],
  },
  {
    id: "hesap-uyelik",
    title: "Hesap & Üyelik",
    items: [
      { q: "Üye olmak zorunda mıyım?", a: <>Sipariş vermek ve AI Stüdyo'yu kullanmak için üyelik gerekir. E-posta/şifre veya Google ile kayıt olabilirsiniz.</> },
      { q: "Aynı telefon veya e-posta ile iki hesap açılır mı?", a: <>Hayır; her e-posta ve her cep telefonu yalnızca bir hesaba bağlanabilir.</> },
      { q: "Şifremi unuttum, ne yapmalıyım?", a: <>Giriş ekranındaki "Şifremi unuttum" ile e-postanıza sıfırlama bağlantısı gönderebilirsiniz.</> },
      { q: "Adreslerimi nasıl yönetirim?", a: <><a href="/profil">Profilim</a>'den adres ekleyip düzenleyebilirsiniz.</> },
    ],
  },
];

export default function SssPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <h1 className="font-serif text-4xl text-text mb-2">Sıkça Sorulan Sorular</h1>
      <p className="text-text-light mb-8">Aradığınız cevabı aşağıdaki kategorilerde bulabilirsiniz.</p>

      <div className="flex flex-wrap gap-2 mb-10">
        {CATEGORIES.map((c) => (
          <a key={c.id} href={`#${c.id}`}
            className="px-4 py-2 rounded-full text-sm font-semibold border border-border text-text-light hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors">
            {c.title}
          </a>
        ))}
      </div>

      <div className="flex flex-col gap-10">
        {CATEGORIES.map((c) => (
          <FaqCategory key={c.id} id={c.id} title={c.title} items={c.items} />
        ))}
      </div>

      <div className="mt-12 bg-white rounded-2xl border border-border p-6 text-center">
        <p className="font-serif text-xl text-text mb-1">Sorunuzu bulamadınız mı?</p>
        <p className="text-sm text-text-light mb-4">Size yardımcı olmaktan memnuniyet duyarız.</p>
        <a href="/iletisim" className="inline-block px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary-hover transition-colors">
          İletişime Geç
        </a>
      </div>
    </div>
  );
}
