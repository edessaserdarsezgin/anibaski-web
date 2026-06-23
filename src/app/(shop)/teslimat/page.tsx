import { getShippingSettings } from "@/lib/shipping";

export const metadata = { title: "Teslimat | AnıBaskı", alternates: { canonical: "/teslimat" } };

const tl = (n: number) => `${n.toLocaleString("tr-TR")} ₺`;

const PATHS: Record<string, string> = {
  truck: "M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H3m16.5 0h-.75m-7.5 0h6m-6 0V5.625A2.625 2.625 0 0 1 12.375 3h3.75A2.625 2.625 0 0 1 18.75 5.625V18.75m-10.5 0V9.375A2.625 2.625 0 0 1 10.875 6.75h3.75",
  clock: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  track: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  shield: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.286Z",
};

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary">
            <path d={PATHS[icon]} />
          </svg>
        </span>
        <h2 className="font-serif text-xl text-text">{title}</h2>
      </div>
      <div className="text-sm text-text-light leading-relaxed [&_a]:text-primary [&_a]:font-semibold [&_a:hover]:underline [&_strong]:text-text">
        {children}
      </div>
    </div>
  );
}

export default async function TeslimatPage() {
  const s = await getShippingSettings();

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <div className="mb-10">
        <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-2">Yardım</p>
        <h1 className="font-serif text-4xl md:text-5xl text-text mb-3">Teslimat</h1>
        <p className="text-text-light max-w-xl">
          Tüm ürünler siparişiniz onaylandıktan sonra özenle üretilir ve anlaşmalı kargo firmalarıyla Türkiye&apos;nin her
          yerine gönderilir.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <Section icon="truck" title="Kargo Ücreti">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Standart kargo ücreti: <strong>{tl(s.shippingFee)}</strong></li>
            <li><strong>{tl(s.freeShippingThreshold)}</strong> ve üzeri siparişlerde <strong>kargo ücretsiz</strong>.</li>
            <li>Kapıda ödeme hizmet bedeli: <strong>{tl(s.codFee)}</strong></li>
          </ul>
        </Section>

        <Section icon="clock" title="Üretim & Teslimat Süresi">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-xl bg-bg border border-border p-4">
              <p className="text-xs text-text-light uppercase tracking-wide mb-1">Üretim</p>
              <p className="font-semibold text-text">{s.productionTime}</p>
            </div>
            <div className="rounded-xl bg-bg border border-border p-4">
              <p className="text-xs text-text-light uppercase tracking-wide mb-1">Kargo</p>
              <p className="font-semibold text-text">{s.shippingTime}</p>
            </div>
          </div>
          <p>{s.orderCutoffNote}</p>
        </Section>

        <Section icon="track" title="Sipariş Takibi">
          <p>
            Siparişiniz kargoya verildiğinde tarafınıza bildirim gönderilir. Durumu dilediğiniz an{" "}
            <a href="/siparisler">Siparişlerim</a> sayfasından takip edebilirsiniz.
          </p>
        </Section>

        <Section icon="shield" title="Hasarlı Teslimat">
          <p>
            Ürününüz kargo kaynaklı bir hasarla ulaştıysa, teslimattan itibaren 3 gün içinde fotoğraflarıyla bize bildirin;
            ürününüz yeniden üretilir veya ücreti iade edilir. Detaylar için{" "}
            <a href="/politikalar/iptal-iade">İptal ve İade</a> sayfasına bakabilirsiniz.
          </p>
        </Section>
      </div>
    </div>
  );
}
