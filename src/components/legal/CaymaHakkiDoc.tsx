import { LegalDocProps } from "./types";
import { SELLER } from "./sellerInfo";

export default function CaymaHakkiDoc({ buyer, date }: LegalDocProps) {
  return (
    <div className="text-sm text-text leading-relaxed space-y-4">
      <p className="text-xs text-text-light">Tarih: {date}</p>
      <p><strong>Alıcı:</strong> {buyer.fullName}</p>

      <h3 className="font-semibold border-b border-border pb-1">1. Genel Cayma Hakkı</h3>
      <p>
        6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği
        uyarınca tüketici, mesafeli sözleşmeyi on dört gün içinde herhangi bir gerekçe
        göstermeksizin ve cezai şart ödemeksizin feshedebilir. Cayma süresi, mal teslimine
        ilişkin sözleşmelerde tüketicinin malı teslim aldığı gün başlar.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">2. Kişiye Özel Ürünlerde Cayma Hakkı İstisnası</h3>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800">
        <p className="font-semibold mb-1">⚠ Bu Sipariş İçin Cayma Hakkı Uygulanmamaktadır</p>
        <p>
          6502 SK Madde 48/4 ve Mesafeli Sözleşmeler Yönetmeliği Madde 15/1-(ç) uyarınca;
          tüketicinin istekleri veya açıkça onun kişisel ihtiyaçları doğrultusunda hazırlanan
          mallar cayma hakkı istisnası kapsamındadır.
        </p>
      </div>
      <p>
        <strong>{SELLER.name}</strong> bünyesinde sunulan tüm ürünler (fotoğraf baskısı,
        fotokitap, tablo, polaroid vb.) müşterinin yüklediği özel fotoğraflar esas alınarak
        <em> yalnızca sipariş sonrasında kişiye özel olarak üretilmektedir.</em> Bu nedenle
        söz konusu ürünler için cayma hakkı kullanılamaz.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">3. Ayıplı/Hasarlı Ürün Hakları</h3>
      <p>
        Cayma hakkı istisnasından bağımsız olarak, teslimatta hasarlı veya üretim kaynaklı
        ayıplı çıkan ürünler için yasal haklarınız saklıdır. Bildirim, teslimattan itibaren
        30 (otuz) gün içinde <strong>{SELLER.email}</strong> adresine yapılmalıdır.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">4. Şikayet Mercii</h3>
      <p>
        Uyuşmazlık halinde ikamet ettiğiniz yerdeki Tüketici Hakem Heyeti&apos;ne veya Tüketici
        Mahkemesi&apos;ne başvurabilirsiniz. Başvurular e-Devlet üzerinden
        (tuketicihakemheyeti.gov.tr) yapılabilir.
      </p>
    </div>
  );
}
