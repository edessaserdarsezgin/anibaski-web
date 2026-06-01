import { LegalDocProps } from "./types";
import { SELLER } from "./sellerInfo";

export default function MesafeliSatisDoc({
  buyer, items, subtotal, shippingFee, discountCode, discountAmount, total, date, orderNumber,
}: LegalDocProps) {
  return (
    <div className="text-sm text-text leading-relaxed space-y-4">
      <p className="text-center font-semibold text-base">MESAFELİ SATIŞ SÖZLEŞMESİ</p>
      <p className="text-xs text-text-light text-center">
        Tarih: {date}{orderNumber ? ` · Sipariş No: ${orderNumber}` : ""}
      </p>

      <h3 className="font-semibold border-b border-border pb-1">MADDE 1 — TARAFLAR</h3>
      <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
        <tbody>
          <tr className="border-b border-border bg-bg">
            <td className="px-3 py-2 font-semibold w-20">SATICI</td>
            <td className="px-3 py-2">
              {SELLER.name} · {SELLER.address}<br />
              {SELLER.email} · {SELLER.phone}<br />
              Vergi No: {SELLER.taxNo} · MERSİS: {SELLER.mersisNo}
            </td>
          </tr>
          <tr>
            <td className="px-3 py-2 font-semibold">ALICI</td>
            <td className="px-3 py-2">
              {buyer.fullName}<br />
              {buyer.email} · {buyer.phone}<br />
              {buyer.address}, {buyer.district}, {buyer.city}{buyer.zip ? ` ${buyer.zip}` : ""}
            </td>
          </tr>
        </tbody>
      </table>

      <h3 className="font-semibold border-b border-border pb-1">MADDE 2 — SÖZLEŞME KONUSU VE ÜRÜNLER</h3>
      <p>
        İşbu sözleşme; SATICI&apos;nın {SELLER.web} adresi üzerinden sunduğu aşağıdaki
        ürünlerin ALICI tarafından satın alınmasına ilişkin olup 6502 SK ve Mesafeli
        Sözleşmeler Yönetmeliği çerçevesinde tarafların hak ve yükümlülüklerini düzenler.
      </p>
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
        <div className="flex justify-between font-semibold border-t border-border pt-2">
          <span>TOPLAM BEDEL (KDV Dahil)</span>
          <span className="text-primary">{total.toLocaleString("tr-TR")} ₺</span>
        </div>
      </div>

      <h3 className="font-semibold border-b border-border pb-1">MADDE 3 — ÖDEME</h3>
      <p>
        Sözleşme bedeli olan <strong>{total.toLocaleString("tr-TR")} ₺</strong>, ALICI&apos;nın
        seçtiği ödeme yöntemiyle tahsil edilir. Kredi/banka kartı ödemesinde bedel sipariş anında,
        kapıda ödemede teslim sırasında alınır.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">MADDE 4 — TESLİMAT</h3>
      <p>
        Ürünler, ödeme teyidinin ardından en geç 5 (beş) iş günü içinde kargoya teslim edilir;
        kargo süreci 1–3 iş günüdür. Teslimat adresi:{" "}
        <strong>
          {buyer.address}, {buyer.district}, {buyer.city}{buyer.zip ? ` ${buyer.zip}` : ""}
        </strong>
      </p>

      <h3 className="font-semibold border-b border-border pb-1">MADDE 5 — CAYMA HAKKI</h3>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800">
        6502 SK Madde 48/4 ve Mesafeli Sözleşmeler Yönetmeliği Madde 15/1-(ç) uyarınca;
        tüketicinin özel isteği doğrultusunda kişiye özel üretilen ürünlerde cayma hakkı
        kullanılamaz. Şirketimiz ürünlerinin tamamı bu istisna kapsamındadır.
      </div>

      <h3 className="font-semibold border-b border-border pb-1">MADDE 6 — GİZLİLİK</h3>
      <p>
        ALICI&apos;nın kişisel verileri, 6698 Sayılı KVKK ve {SELLER.web} Gizlilik
        Politikası kapsamında; sipariş ve kargo işlemleri dışında üçüncü taraflarla paylaşılmaz.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">MADDE 7 — UYUŞMAZLIK ÇÖZÜMÜ</h3>
      <p>
        Uyuşmazlıklarda önce {SELLER.email} adresine başvurulması önerilir.
        Çözümsüz kalan uyuşmazlıklar için Tüketici Hakem Heyeti veya Tüketici
        Mahkemesi yetkilidir.
      </p>

      <p className="text-xs text-text-light border-t border-border pt-4">
        Bu sözleşme, ALICI&apos;nın ödeme işlemini tamamlamasıyla elektronik ortamda
        kurulmuş ve her iki tarafça kabul edilmiş sayılır.
      </p>
    </div>
  );
}
