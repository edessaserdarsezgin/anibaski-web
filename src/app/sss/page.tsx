export const metadata = { title: "Sıkça Sorulan Sorular | AnıBaskı" };

const WRAP =
  "max-w-3xl mx-auto px-8 py-12 prose prose-sm prose-headings:font-serif " +
  "prose-headings:text-text prose-p:text-text-light prose-li:text-text-light " +
  "prose-strong:text-text prose-a:text-primary";

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Nasıl sipariş veririm?",
    a: <>Ürünü seçip fotoğrafınızı yükleyin, sepete ekleyin ve ödemeyi tamamlayın. Kişiye özel ürünlerde yükleyeceğiniz fotoğraf doğrudan baskıya gider.</>,
  },
  {
    q: "Fotoğrafım baskı için yeterli kalitede mi?",
    a: <>En iyi sonuç için net ve yüksek çözünürlüklü fotoğraflar öneririz. Düşük çözünürlüklü fotoğraflarınızı <a href="/studyo">AI Stüdyo</a> ile netleştirip büyütebilirsiniz.</>,
  },
  {
    q: "Teslimat ne kadar sürer?",
    a: <>Hafta içi 14:00&apos;a kadar verilen siparişler aynı gün üretime alınır. Üretim 1–3, kargo 1–3 iş günü sürer. Detaylar için <a href="/teslimat">Teslimat</a> sayfasına bakın.</>,
  },
  {
    q: "Kargo ücreti ne kadar?",
    a: <>Güncel kargo ücreti ve ücretsiz kargo sınırı <a href="/teslimat">Teslimat</a> sayfasında yer alır. Belirli tutarın üzerindeki siparişlerde kargo ücretsizdir.</>,
  },
  {
    q: "Hangi ödeme yöntemlerini kullanabilirim?",
    a: <>Kredi/banka kartı ile güvenli ödeme (PayTR altyapısı) ve uygun ürünlerde kapıda ödeme seçeneği sunuyoruz.</>,
  },
  {
    q: "Siparişimi iptal edebilir veya iade edebilir miyim?",
    a: <>Üretim başlamadan iptal talebi oluşturabilirsiniz. Kişiye özel ürünlerde yasal cayma hakkı istisnası geçerlidir; üretim/kargo hatalarında yeniden üretim veya iade yapılır. Detaylar: <a href="/politikalar/iptal-iade">İptal ve İade</a>.</>,
  },
  {
    q: "AI Stüdyo nedir?",
    a: <><a href="/studyo">AI Stüdyo</a>, fotoğraflarınızı baskı öncesi netleştirmenize, büyütmenize ve çeşitli efektler uygulamanıza yarayan yapay zeka aracıdır. Üye olan herkese ücretsiz deneme hakkı tanımlanır.</>,
  },
];

export default function SssPage() {
  return (
    <div className={WRAP}>
      <article>
        <h1>Sıkça Sorulan Sorular</h1>
        {FAQ.map((item, i) => (
          <div key={i}>
            <h2>{item.q}</h2>
            <p>{item.a}</p>
          </div>
        ))}
        <h2>Sorunuzu bulamadınız mı?</h2>
        <p>
          <a href="/iletisim">İletişim</a> sayfasından bize ulaşın, en kısa sürede
          yardımcı olalım.
        </p>
      </article>
    </div>
  );
}
