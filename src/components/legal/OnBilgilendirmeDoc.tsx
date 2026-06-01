import { LegalDocProps } from "./types";
import { SELLER } from "./sellerInfo";

export default function OnBilgilendirmeDoc({
  buyer, items, subtotal, shippingFee, discountCode, discountAmount, total, date, orderNumber,
}: LegalDocProps) {
  return (
    <div className="text-sm text-text leading-relaxed space-y-4">
      <p className="text-center font-semibold text-base">ÖN BİLGİLENDİRME FORMU</p>
      <p className="text-xs text-text-light text-center">
        Tarih: {date}{orderNumber ? ` · Sipariş No: ${orderNumber}` : ""}
      </p>

      <h3 className="font-semibold border-b border-border pb-1">SATICI BİLGİLERİ</h3>
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

      <h3 className="font-semibold border-b border-border pb-1">ALICI BİLGİLERİ</h3>
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

      <h3 className="font-semibold border-b border-border pb-1">SİPARİŞ İÇERİĞİ</h3>
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

      <h3 className="font-semibold border-b border-border pb-1">TESLİMAT BİLGİLERİ</h3>
      <p>
        Siparişiniz ödeme teyidinin ardından en geç 5 (beş) iş günü içinde kargoya verilecektir.
        Kargo süreci 1–3 iş günü alabilir. Kargo takip bilgisi SMS ve e-posta ile iletilecektir.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">CAYMA HAKKI</h3>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
        Mesafeli Sözleşmeler Yönetmeliği Madde 15/1-(ç) uyarınca; sipariş edilen ürünler
        tüketicinin özel isteği doğrultusunda kişiye özel üretildiğinden cayma hakkı
        uygulanmamaktadır.
      </div>

      <h3 className="font-semibold border-b border-border pb-1">ŞİKAYET MERCİİ</h3>
      <p>
        Uyuşmazlıklarda Tüketici Hakem Heyeti (tuketicihakemheyeti.gov.tr) veya
        Tüketici Mahkemesi&apos;ne başvurabilirsiniz.
      </p>
    </div>
  );
}
