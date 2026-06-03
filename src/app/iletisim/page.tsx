import { getCompanyInfo } from "@/lib/company";

export const metadata = { title: "İletişim | AnıBaskı" };

const WRAP =
  "max-w-3xl mx-auto px-8 py-12 prose prose-sm prose-headings:font-serif " +
  "prose-headings:text-text prose-p:text-text-light prose-li:text-text-light " +
  "prose-strong:text-text prose-a:text-primary";

export default async function IletisimPage() {
  const c = await getCompanyInfo();
  const phone = c.supportPhone || c.phone;

  return (
    <div className={WRAP}>
      <article>
        <h1>İletişim</h1>
        <p>
          Sorularınız, görüşleriniz ve destek talepleriniz için bize ulaşabilirsiniz.
          Size en kısa sürede dönüş yapıyoruz.
        </p>

        <h2>Bize Ulaşın</h2>
        <ul>
          <li>
            <strong>E-posta:</strong>{" "}
            <a href={`mailto:${c.email}`}>{c.email}</a>
          </li>
          {phone && (
            <li>
              <strong>Telefon:</strong>{" "}
              <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
            </li>
          )}
          {c.workingHours && (
            <li>
              <strong>Çalışma Saatleri:</strong> {c.workingHours}
            </li>
          )}
          {c.address && (
            <li>
              <strong>Adres:</strong> {c.address}
            </li>
          )}
        </ul>

        <h2>Sipariş Desteği</h2>
        <p>
          Mevcut bir siparişinizle ilgili yardım için{" "}
          <a href="/siparisler">Siparişlerim</a> sayfasından sipariş durumunuzu takip
          edebilir; üretim, kargo veya iade konularında bize e-posta ile
          yazabilirsiniz.
        </p>
      </article>
    </div>
  );
}
