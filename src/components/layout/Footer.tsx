import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-bg">
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="font-serif text-xl text-text">
              Anı<span className="text-primary">Baskı</span>
            </Link>
            <p className="mt-3 text-sm text-text-light">
              Hayatın en güzel anlarını dokunulur kılıyoruz. Türkiye&apos;nin her yerine sevgiyle teslimat.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-sm font-semibold text-text mb-3">Kategoriler</h4>
            <ul className="space-y-2 text-sm text-text-light">
              <li><Link href="/urunler/foto-kitap" className="hover:text-primary transition-colors">Foto Kitap</Link></li>
              <li><Link href="/urunler/fotograf-baski" className="hover:text-primary transition-colors">Fotoğraf Baskı</Link></li>
              <li><Link href="/urunler/duvar-dekorasyonu" className="hover:text-primary transition-colors">Duvar Dekorasyonu</Link></li>
              <li><Link href="/urunler/hediyeler" className="hover:text-primary transition-colors">Hediyelikler</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-sm font-semibold text-text mb-3">Yardım</h4>
            <ul className="space-y-2 text-sm text-text-light">
              <li><Link href="/siparisler" className="hover:text-primary transition-colors">Sipariş Takibi</Link></li>
              <li><Link href="/teslimat" className="hover:text-primary transition-colors">Teslimat</Link></li>
              <li><Link href="/sss" className="hover:text-primary transition-colors">S.S.S</Link></li>
              <li><Link href="/iletisim" className="hover:text-primary transition-colors">İletişim</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-text-light">
          &copy; 2026 AnıBaskı. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}
