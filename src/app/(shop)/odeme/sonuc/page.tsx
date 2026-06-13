import OdemeSonucBreakout from "./OdemeSonucBreakout";

// PayTR iframe başarı/başarısızlık sonrası buraya (iframe İÇİNDE) döner.
// Public sayfa — auth kontrolü YOK; tek işi iframe'den top pencereye çıkıp
// gerçek (korumalı) hedefe top-level navigasyonla gitmek. Böylece oturum
// cookie'si (SameSite=Lax) gider ve hedef sayfa kullanıcıyı tanır.
export const metadata = { title: "Yönlendiriliyor…", robots: { index: false, follow: false } };

export default async function OdemeSonucPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; fail?: string }>;
}) {
  const { order, fail } = await searchParams;
  const target = order && fail !== "1" ? `/siparis-tamamlandi/${order}` : "/odeme?fail=1";
  return <OdemeSonucBreakout target={target} />;
}
