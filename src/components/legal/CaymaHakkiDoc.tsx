import { LegalDocProps } from "./types";
import { CaymaIstisnaListesi } from "./shared";

export default function CaymaHakkiDoc({ buyer, date, seller }: LegalDocProps) {
  return (
    <div className="text-sm text-text leading-relaxed space-y-4">
      <p className="text-xs text-text-light">Tarih: {date}</p>
      <p><strong>Alıcı:</strong> {buyer.fullName}</p>

      <h3 className="font-semibold border-b border-border pb-1">1. Genel Cayma Hakkı</h3>
      <p>
        Mesafeli sözleşmelerde tüketici, on dört (14) gün içerisinde herhangi bir gerekçe
        göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.
      </p>
      <p>
        Cayma hakkı süresi, malın teslimine ilişkin sözleşmelerde tüketicinin malı teslim
        aldığı günden itibaren, diğer sözleşmelerde ise sözleşmenin akdedildiği günden
        itibaren işlemeye başlar.
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
        <strong>{seller.name}</strong> bünyesinde sunulan tüm ürünler (fotoğraf baskısı,
        fotokitap, tablo, polaroid vb.) müşterinin yüklediği özel fotoğraflar esas alınarak
        <em> yalnızca sipariş sonrasında kişiye özel olarak üretilmektedir.</em> Bu nedenle
        söz konusu ürünler için cayma hakkı kullanılamaz.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">3. Cayma Hakkının Kullanılma Koşulları</h3>
      <p>
        Cayma hakkının istisna kapsamına girmeyen bir ürün için kullanılması halinde, teslim
        edilen ürünün ve fatura aslının iadesi zorunludur. Fatura aslı iade edilmez ise; satıcı,
        KDV ve varsa sair yasal yükümlülükleri, tüketiciye iade edilecek bedelden tahsil edecektir.
      </p>
      <p>
        Vergi Usul Kanunu&apos;nun 385 Sıra No&apos;lu Genel Tebliği uyarınca, iade işlemlerinin
        yapılabilmesi için tarafınıza gönderilen iade bölümü bulunan faturadaki ilgili
        bölümlerin eksiksiz doldurulup imzalanması ve ürünle birlikte geri gönderilmesi gerekir.
      </p>
      <p>
        İade için öngörülen taşıyıcı, ürünün tarafınıza teslim edildiği kargo firmasıdır.
        Belirtilen firma aracılığıyla yapılan iadelerde kargo bedeli satıcı tarafından karşılanır;
        aksi halde kargo ücretinden ALICI sorumludur.
      </p>
      <p>
        Alıcının cayma hakkını kullanması halinde satıcı, cayma bildiriminin kendisine ulaştığı
        tarihten itibaren en geç on dört (14) gün içerisinde, varsa teslim masrafları da dahil
        tahsil edilen tüm ödemeleri tüketiciye hiçbir masraf yüklemeksizin iade etmekle
        yükümlüdür. Cayma bildirimini takip eden on (10) gün içinde ALICI malı satıcıya iade
        etmek zorundadır.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">4. Cayma Hakkının Kullanılamayacağı Haller</h3>
      <p>Tüketici aşağıdaki hallerde cayma hakkını kullanamaz:</p>
      <CaymaIstisnaListesi />

      <h3 className="font-semibold border-b border-border pb-1">5. Cayma Bildirimi ve İletişim</h3>
      <p>
        Cayma bildirimi ve ürün hasarı/ayıplı mal bildirimleri için:
      </p>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="py-1 pr-4 text-text-light align-top w-24">Adres</td>
            <td className="py-1">{seller.address}</td>
          </tr>
          <tr>
            <td className="py-1 pr-4 text-text-light align-top">E-posta</td>
            <td className="py-1">{seller.email}</td>
          </tr>
          <tr>
            <td className="py-1 pr-4 text-text-light align-top">Telefon</td>
            <td className="py-1">{seller.phone}</td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-text-light">
        Cayma hakkı istisnasından bağımsız olarak, teslimatta hasarlı veya üretim kaynaklı
        ayıplı çıkan ürünler için yasal haklarınız saklıdır.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">6. Şikayet Mercii</h3>
      <p>
        Uyuşmazlık halinde, Ticaret Bakanlığı&apos;nca ilan edilen parasal sınırlar dahilinde
        ikamet ettiğiniz yerdeki Tüketici Hakem Heyeti&apos;ne veya Tüketici Mahkemesi&apos;ne
        başvurabilirsiniz. Başvurular e-Devlet üzerinden (tuketicihakemheyeti.gov.tr) yapılabilir.
      </p>
    </div>
  );
}
