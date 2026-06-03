import { getShippingSettings } from "@/lib/shipping";

export const metadata = { title: "Teslimat | AnıBaskı" };

const WRAP =
  "max-w-3xl mx-auto px-8 py-12 prose prose-sm prose-headings:font-serif " +
  "prose-headings:text-text prose-p:text-text-light prose-li:text-text-light " +
  "prose-strong:text-text prose-a:text-primary";

const tl = (n: number) => `${n.toLocaleString("tr-TR")} ₺`;

export default async function TeslimatPage() {
  const s = await getShippingSettings();

  return (
    <div className={WRAP}>
      <article>
        <h1>Teslimat</h1>
        <p>
          Tüm ürünler siparişiniz onaylandıktan sonra özenle üretilir ve anlaşmalı
          kargo firmalarıyla Türkiye&apos;nin her yerine gönderilir.
        </p>

        <h2>Kargo Ücreti</h2>
        <ul>
          <li>Standart kargo ücreti: <strong>{tl(s.shippingFee)}</strong></li>
          <li>
            <strong>{tl(s.freeShippingThreshold)}</strong> ve üzeri siparişlerde{" "}
            <strong>kargo ücretsiz</strong>.
          </li>
          <li>Kapıda ödeme hizmet bedeli: <strong>{tl(s.codFee)}</strong></li>
        </ul>

        <h2>Üretim ve Teslimat Süresi</h2>
        <p>
          Kişiye özel ürünler olduğu için her sipariş özel olarak hazırlanır.
          Hafta içi <strong>14:00</strong>&apos;a kadar verilen siparişler aynı gün
          üretime alınır. Üretim 1–3 iş günü, kargo teslimatı bulunduğunuz bölgeye
          göre genellikle 1–3 iş günü sürer.
        </p>

        <h2>Sipariş Takibi</h2>
        <p>
          Siparişiniz kargoya verildiğinde tarafınıza bildirim gönderilir. Durumu
          dilediğiniz an <a href="/siparisler">Siparişlerim</a> sayfasından takip
          edebilirsiniz.
        </p>

        <h2>Hasarlı Teslimat</h2>
        <p>
          Ürününüz kargo kaynaklı bir hasarla ulaştıysa, teslimattan itibaren 3 gün
          içinde fotoğraflarıyla bize bildirin; ürününüz yeniden üretilir veya ücreti
          iade edilir. Detaylar için <a href="/politikalar/iptal-iade">İptal ve İade</a>{" "}
          sayfasına bakabilirsiniz.
        </p>
      </article>
    </div>
  );
}
