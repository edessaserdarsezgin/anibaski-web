import { getCompanyInfo } from "@/lib/company";

export const metadata = { title: "İletişim | AnıBaskı" };

function waLink(num: string): string {
  const d = num.replace(/\D/g, "");
  const intl = d.startsWith("90") ? d : d.startsWith("0") ? "9" + d : "90" + d;
  return `https://wa.me/${intl}`;
}

const PATHS: Record<string, string> = {
  mail: "M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75",
  phone: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z",
  chat: "M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z",
  clock: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  pin: "M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z",
};

function Card({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-start gap-4 bg-white rounded-2xl border border-border p-5 h-full hover:shadow-soft hover:border-primary/30 transition-all">
      <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary">
          <path d={PATHS[icon]} />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="text-xs text-text-light uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm font-semibold text-text break-words">{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="block">
      {inner}
    </a>
  ) : (
    inner
  );
}

export default async function IletisimPage() {
  const c = await getCompanyInfo();
  const phone = c.supportPhone || c.phone;
  const wa = c.supportPhone || c.phone;

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="mb-10">
        <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-2">Bize Ulaşın</p>
        <h1 className="font-serif text-4xl md:text-5xl text-text mb-3">İletişim</h1>
        <p className="text-text-light max-w-xl">
          Sorularınız, görüşleriniz ve destek talepleriniz için aşağıdaki kanallardan bize ulaşabilirsiniz. Size en
          kısa sürede dönüş yapıyoruz.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <Card icon="mail" label="E-posta" value={c.email} href={`mailto:${c.email}`} />
        {phone && <Card icon="phone" label="Telefon" value={phone} href={`tel:${phone.replace(/\s/g, "")}`} />}
        {c.landline && (
          <Card icon="phone" label="Sabit Telefon" value={c.landline} href={`tel:${c.landline.replace(/\s/g, "")}`} />
        )}
        {wa && <Card icon="chat" label="WhatsApp" value="Hemen mesaj gönderin" href={waLink(wa)} />}
        {c.workingHours && <Card icon="clock" label="Çalışma Saatleri" value={c.workingHours} />}
        {c.address && <Card icon="pin" label="Adres" value={c.address} />}
      </div>

      {wa && (
        <a
          href={waLink(wa)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-full transition-colors mb-10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d={PATHS.chat} />
          </svg>
          WhatsApp ile Yazın
        </a>
      )}

      <div className="bg-bg border border-border rounded-2xl p-6">
        <h2 className="font-serif text-xl text-text mb-2">Sipariş Desteği</h2>
        <p className="text-sm text-text-light">
          Mevcut bir siparişinizle ilgili yardım için{" "}
          <a href="/siparisler" className="text-primary font-semibold hover:underline">
            Siparişlerim
          </a>{" "}
          sayfasından durumunuzu takip edebilir; üretim, kargo veya iade konularında bize yazabilirsiniz.
        </p>
      </div>
    </div>
  );
}
