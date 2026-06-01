import { LegalDocProps } from "./types";
import { SELLER } from "./sellerInfo";
import { CaymaIstisnaListesi } from "./shared";

export default function MesafeliSatisDoc({
  buyer, items, subtotal, shippingFee, discountCode, discountAmount, total, date, orderNumber,
}: LegalDocProps) {
  return (
    <div className="text-sm text-text leading-relaxed space-y-4">
      <p className="text-center font-semibold text-base">MESAFELİ SATIŞ SÖZLEŞMESİ</p>
      <p className="text-xs text-text-light text-center">
        Tarih: {date}{orderNumber ? ` · Sipariş No: ${orderNumber}` : ""}
      </p>

      <p className="text-xs">
        ALICI, {SELLER.web} internet sitesinde sözleşme konusu ürünün temel niteliklerini, satış
        fiyatını, ödeme şeklini ve teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu;
        bu sözleşmenin hükümlerini kabul ettiğini ve elektronik ortamda gerekli onayı verdiğini
        kabul ve beyan eder.
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

      <h3 className="font-semibold border-b border-border pb-1">MADDE 2 — KONU</h3>
      <p>
        İşbu sözleşmenin konusu; ALICI&apos;nın, SATICI&apos;ya ait {SELLER.web} alan adlı web
        sitesinden elektronik ortamda sipariş verdiği, özellikleri ve satış fiyatı aşağıda
        belirtilen ürünün satışı, teslimi ve bedelinin ödenmesine ilişkin olarak 6502 Sayılı
        Kanun ve Mesafeli Sözleşmeler Yönetmeliği gereği tarafların hak ve yükümlülüklerinin
        belirlenmesidir.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">MADDE 3 — SÖZLEŞME KONUSU ÜRÜN VE ÖDEME</h3>
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
      <p className="text-xs">
        Sözleşme bedeli ALICI&apos;nın seçtiği ödeme yöntemiyle tahsil edilir. Kredi/banka kartı
        ödemesinde bedel sipariş anında, kapıda ödemede teslim sırasında alınır. Kredi kartınızın
        hesap kesim tarihinden itibaren sipariş toplamı, seçilen taksit adedine bölünerek banka
        tarafından kart özetinize yansıtılır; taksit dağıtımı bankanın inisiyatifindedir.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">MADDE 4 — TESLİMAT</h3>
      <p className="text-xs">
        Ürünler, yasal 30 günlük süreyi aşmamak koşuluyla, ödemenin onaylanmasının ardından en
        geç 5 (beş) iş günü içinde kargoya teslim edilir; kargo süreci 1–3 iş günüdür. Teslimat
        adresi: <strong>{buyer.address}, {buyer.district}, {buyer.city}{buyer.zip ? ` ${buyer.zip}` : ""}</strong>.
        Teslimat anında ALICI&apos;nın adresinde bulunmaması durumunda SATICI edimini tam ve
        eksiksiz yerine getirmiş sayılır. SATICI, ürünün sağlam, eksiksiz ve siparişte belirtilen
        niteliklere uygun teslim edilmesinden sorumludur.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">MADDE 5 — CAYMA HAKKI</h3>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800">
        6502 SK Madde 48/4 ve Mesafeli Sözleşmeler Yönetmeliği Madde 15/1-(ç) uyarınca;
        tüketicinin özel isteği doğrultusunda kişiye özel üretilen ürünlerde cayma hakkı
        kullanılamaz. Şirketimiz ürünlerinin tamamı bu istisna kapsamındadır.
      </div>
      <p className="text-xs">
        Genel olarak tüketici, malı teslim aldığı günden itibaren on dört (14) gün içinde cayma
        hakkına sahiptir. Aşağıdaki hallerde ise cayma hakkı kullanılamaz:
      </p>
      <CaymaIstisnaListesi />
      <p className="text-xs">
        Cayma hakkının kullanılabildiği hallerde, cayma bildiriminin SATICI&apos;ya ulaştığı
        tarihten itibaren 14 gün içinde tahsil edilen tüm ödemeler iade edilir; ALICI da bildirimi
        takip eden 10 gün içinde ürünü iade etmekle yükümlüdür. Cayma bildirimi {SELLER.email}
        {" "}adresine yapılabilir.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">MADDE 6 — İADE PROSEDÜRÜ</h3>
      <p className="text-xs">
        Kredi kartı ile taksitli yapılan alışverişlerde iade, ALICI&apos;nın ürünü kaç taksitle
        aldıysa banka tarafından aynı sayıda taksitle gerçekleştirilir. SATICI, banka ile yaptığı
        sözleşme gereği kartla yapılan ödemelerde ALICI&apos;ya nakit iade yapamaz; iade işlemi
        ilgili yazılım aracılığıyla kart üzerinden yapılır. Kapıda ödeme servis bedeli kargo
        şirketine ait olup, ürün iadesi halinde SATICI tarafından ALICI&apos;ya iade edilir.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">MADDE 7 — TEMERRÜT HÜKÜMLERİ</h3>
      <p className="text-xs">
        Tarafların işbu sözleşmeden kaynaklanan edimlerini yerine getirmemesi durumunda 6098
        Sayılı Türk Borçlar Kanunu&apos;ndaki temerrüt hükümleri uygulanır. Edimini süresi içinde
        haklı bir sebep olmaksızın yerine getirmeyen tarafa, diğer tarafça 7 (yedi) günlük süre
        verilir. Edimin bu süre içinde de yerine getirilmemesi halinde, edimini yerine getirmeyen
        taraf temerrüde düşmüş sayılır ve alacaklı, edimin ifasını veya sözleşmeden dönerek bedel
        iadesini talep etme hakkına sahiptir.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">MADDE 8 — MÜCBİR SEBEP</h3>
      <p className="text-xs">
        SATICI&apos;nın yükümlülüğünü yerine getirmesini engelleyen mücbir sebepler (nakliyeyi
        engelleyen hava muhalefeti, ulaşımın kesilmesi, yangın, deprem, sel gibi olağanüstü
        olaylar) nedeniyle ürün süresinde teslim edilemezse, ALICI siparişin iptalini veya
        engelleyici durum ortadan kalkana kadar ertelenmesini talep edebilir. Siparişin iptali
        halinde ödenen tutar 14 gün içinde ALICI&apos;ya iade edilir.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">MADDE 9 — GİZLİLİK</h3>
      <p className="text-xs">
        ALICI&apos;nın kişisel verileri, 6698 Sayılı KVKK ve {SELLER.web} Gizlilik Politikası
        kapsamında; sipariş ve kargo işlemleri dışında üçüncü taraflarla paylaşılmaz.
      </p>

      <h3 className="font-semibold border-b border-border pb-1">MADDE 10 — UYUŞMAZLIK ÇÖZÜMÜ</h3>
      <p className="text-xs">
        Bu sözleşmenin uygulanmasında, Ticaret Bakanlığı&apos;nca ilan edilen parasal sınırlar
        dahilinde, ALICI&apos;nın mal veya hizmeti satın aldığı yerdeki veya yerleşim yerindeki
        Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir. Uyuşmazlıklarda önce
        {" "}{SELLER.email} adresine başvurulması önerilir.
      </p>

      <p className="text-xs text-text-light border-t border-border pt-4">
        Bu sözleşme, ALICI&apos;nın ödeme işlemini tamamlamasıyla elektronik ortamda kurulmuş ve
        her iki tarafça kabul edilmiş sayılır.
      </p>
    </div>
  );
}
