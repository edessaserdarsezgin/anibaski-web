import { LegalDocProps } from "./types";
import { SELLER } from "./sellerInfo";
import { CaymaIstisnaListesi } from "./shared";

export default function OnBilgilendirmeDoc({
  buyer, items, subtotal, shippingFee, discountCode, discountAmount, total, date, orderNumber,
}: LegalDocProps) {
  return (
    <div className="text-sm text-text leading-relaxed space-y-4">
      <p className="text-center font-semibold text-base">ÖN BİLGİLENDİRME FORMU</p>
      <p className="text-xs text-text-light text-center">
        Tarih: {date}{orderNumber ? ` · Sipariş No: ${orderNumber}` : ""}
      </p>

      <h3 className="font-semibold border-b border-border pb-1">1. SATICI BİLGİLERİ</h3>
      <table className="w-full text-sm">
        <tbody>
          {[
            ["Ünvan", SELLER.name],
            ["Adres", SELLER.address],
            ["E-posta", SELLER.email],
            ["Telefon", SELLER.phone],
            ["Vergi No", SELLER.taxNo],
            ["MERSİS No", SELLER.mersisNo],
            ["Web", SELLER.web],
          ].map(([label, value]) => (
            <tr key={label}>
              <td className="py-1 pr-4 text-text-light align-top w-32">{label}</td>
              <td className="py-1">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="font-semibold border-b border-border pb-1">2. ALICI BİLGİLERİ</h3>
      <table className="w-full text-sm">
        <tbody>
          {[
            ["Ad Soyad", buyer.fullName],
            ["E-posta", buyer.email],
            ["Telefon", buyer.phone],
            ["Teslimat Adresi", `${buyer.address}, ${buyer.district}, ${buyer.city}${buyer.zip ? ` ${buyer.zip}` : ""}`],
          ].map(([label, value]) => (
            <tr key={label}>
              <td className="py-1 pr-4 text-text-light align-top w-32">{label}</td>
              <td className="py-1">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="font-semibold border-b border-border pb-1">3. KONU</h3>
      <p>
        İşbu Ön Bilgilendirme Formu, aşağıda nitelik ve satış fiyatı belirtilen ürünlerin satışı
        ve teslimi ile ilgili olarak 6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli
        Sözleşmeler Yönetmeliği hükümleri gereğince alıcının bilgilendirilmesine ilişkindir ve
        tüketici ile akdedilecek Mesafeli Satış Sözleşmesi&apos;nin ayrılmaz parçasıdır.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">4. ÜRÜNÜN TEMEL NİTELİKLERİ VE SATIŞ FİYATI</h3>
      <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
        <thead className="bg-bg">
          <tr>
            <th className="text-left px-3 py-2">Ürün</th>
            <th className="text-right px-3 py-2">Adet</th>
            <th className="text-right px-3 py-2">Br. Fiyat</th>
            <th className="text-right px-3 py-2">Toplam</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-3 py-2">
                {item.name}
                {item.variantLabel && (
                  <span className="text-text-light block text-xs">{item.variantLabel}</span>
                )}
              </td>
              <td className="px-3 py-2 text-right">{item.quantity}</td>
              <td className="px-3 py-2 text-right">{item.unitPrice.toLocaleString("tr-TR")} ₺</td>
              <td className="px-3 py-2 text-right">
                {(item.unitPrice * item.quantity).toLocaleString("tr-TR")} ₺
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-text-light">Ara Toplam</span>
          <span>{subtotal.toLocaleString("tr-TR")} ₺</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-light">Kargo ve Teslimat</span>
          <span>{shippingFee === 0 ? "Ücretsiz" : `${shippingFee.toLocaleString("tr-TR")} ₺`}</span>
        </div>
        {discountCode && discountAmount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>İndirim ({discountCode})</span>
            <span>−{discountAmount.toLocaleString("tr-TR")} ₺</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-base border-t border-border pt-2">
          <span>GENEL TOPLAM (KDV Dahil)</span>
          <span className="text-primary">{total.toLocaleString("tr-TR")} ₺</span>
        </div>
      </div>

      <h3 className="font-semibold border-b border-border pb-1">5. ÖDEME VE TESLİMAT</h3>
      <ul className="list-disc pl-5 space-y-1.5 text-xs">
        <li>
          Sipariş özeti sayfasında, kredi kartı ile ödemede bankanıza iletilecek sipariş
          toplamının kaç taksitle ödeneceği bilgisi yer alır. Banka, seçtiğiniz taksit adedinin
          üstünde taksit veya taksit öteleme gibi kampanyalar uygulayabilir; bu kampanyalar
          bankanızın inisiyatifindedir.
        </li>
        <li>
          Kapıda ödeme servisi kargo şirketi tarafından sağlanan bir ödeme seçeneğidir. Bu servis
          için kargo şirketi ek ücret tahsil eder; bu bedel kargo şirketine aittir ve kapıda ödeme
          seçildiğinde ALICI tarafından karşılanır.
        </li>
        <li>
          Sözleşme konusu ürün, yasal 30 günlük süreyi aşmamak koşuluyla, ödemenin onaylanmasının
          ardından en geç 5 (beş) iş günü içinde kargoya verilir. Kargo süreci 1–3 iş günüdür.
          Kargo takip bilgisi SMS ve e-posta ile iletilir.
        </li>
        <li>Kargo ücreti, ücretsiz kargo eşiği altındaki siparişlerde sipariş toplamına eklenir.</li>
      </ul>

      <h3 className="font-semibold border-b border-border pb-1">6. CAYMA HAKKI</h3>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
        Mesafeli Sözleşmeler Yönetmeliği Madde 15/1-(ç) uyarınca; sipariş edilen ürünler
        tüketicinin özel isteği doğrultusunda kişiye özel üretildiğinden cayma hakkı
        uygulanmamaktadır. Cayma hakkının genel koşulları ve diğer istisnalar aşağıdaki gibidir.
      </div>
      <p className="text-xs">
        Mesafeli sözleşmelerde tüketici, malı teslim aldığı günden itibaren on dört (14) gün
        içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkına
        sahiptir. Aşağıdaki hallerde ise cayma hakkı kullanılamaz:
      </p>
      <CaymaIstisnaListesi />

      <h3 className="font-semibold border-b border-border pb-1">7. GENEL HÜKÜMLER</h3>
      <ul className="list-disc pl-5 space-y-1.5 text-xs">
        <li>
          Alıcı, işbu Form&apos;da satışa konu ürünün temel nitelikleri, satış fiyatı, ödeme
          şekli ve teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik
          ortamda gerekli teyidi verdiğini beyan eder.
        </li>
        <li>
          Sözleşme konusu ürünün teslimatı için bedelin, alıcının tercih ettiği ödeme şekliyle
          ödenmiş olması şarttır. Ürün bedeli herhangi bir nedenle ödenmez veya banka kayıtlarında
          iptal edilirse, satıcı ürünü teslim yükümlülüğünden kurtulmuş sayılır.
        </li>
      </ul>

      <h3 className="font-semibold border-b border-border pb-1">8. ŞİKAYET VE İTİRAZLAR</h3>
      <p className="text-xs">
        İşbu bilgilendirmenin uygulanmasında, Ticaret Bakanlığı&apos;nca ilan edilen parasal
        sınırlar dahilinde, alıcının mal veya hizmeti satın aldığı ve ikametgâhının bulunduğu
        yerdeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir
        (tuketicihakemheyeti.gov.tr).
      </p>

      <p className="text-xs text-text-light border-t border-border pt-4">
        İşbu Ön Bilgilendirme Formu, Alıcı tarafından elektronik ortamda okunup kabul edildikten
        sonra Mesafeli Satış Sözleşmesi kurulması aşamasına geçilir.
      </p>
    </div>
  );
}
