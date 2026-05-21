import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

const categories = [
  { title: "Fotoğraf Baskıları", desc: "Anılarınızı en net ve canlı haliyle kağıda dökün.", slug: "fotograf-baskilari" },
  { title: "Duvar Dekorasyonu", desc: "Evinizin duvarlarını sanata dönüştürün.", slug: "duvar-dekorasyonu" },
  { title: "Albümler ve Kitaplar", desc: "Hikayenizi baştan sona sayfalarca anlatın.", slug: "albumler-ve-kitaplar" },
  { title: "Kişiye Özel Hediyeler", desc: "Sevdiklerinizi mutlu edecek ince düşünülmüş detaylar.", slug: "kisiye-ozel-hediyeler" },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* Top Bar */}
        <div className="bg-primary text-white text-center py-2 text-sm font-semibold tracking-wide">
          Anneler Günü&apos;ne özel tüm Foto Kitaplarda %20 İndirim! Kod: ANNE20
        </div>

        {/* Hero */}
        <section className="bg-bg py-24 px-8">
          <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-6">
            <h1 className="font-serif text-4xl md:text-6xl text-text leading-tight max-w-2xl">
              Dijital anılarınızı<br />gerçek hatıralara dönüştürün.
            </h1>
            <p className="text-text-light max-w-xl text-lg">
              Telefonunuzda kalan o güzel anları, evinize neşe katacak fotoğraflara, kitaplara ve tablolara çevirin.
            </p>
            <Link
              href="/urunler"
              className="mt-2 px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-colors"
            >
              Baskıya Başla
            </Link>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-serif text-3xl text-text text-center mb-12">
              Ne yapmak istersiniz?
            </h2>
            <div className="grid grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/kategoriler/${cat.slug}`}
                  className="group p-4 rounded-xl border border-border bg-white hover:shadow-hover hover:border-primary transition-all"
                >
                  <h3 className="font-serif text-base text-text mb-1.5 group-hover:text-primary transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-text-light">{cat.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-8 bg-white border-y border-border">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: "✨", title: "Premium Kalite", desc: "Solmayan, canlı renkler veren Fujifilm fotoğraf kağıtlarına basıyoruz." },
              { icon: "📱", title: "Kolay Tasarım", desc: "Doğrudan telefonunuzdan veya bilgisayarınızdan saniyeler içinde yükleyin." },
              { icon: "🎁", title: "Özenli Paketleme", desc: "Hediye etmeye hazır, şık ve zarar görmeyecek özel kutularda gönderiyoruz." },
            ].map((f) => (
              <div key={f.title} className="p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-serif text-lg text-text mb-2">{f.title}</h3>
                <p className="text-sm text-text-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
