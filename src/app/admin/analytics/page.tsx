import { createAdminClient } from "@/lib/supabase/server";

export const metadata = { title: "Analitik | AnıBaskı Admin" };

export default async function AnalyticsPage() {
  const adminClient = createAdminClient();

  const [{ data: sourceStats }, { data: thisMonthAI }] = await Promise.all([
    adminClient.from("orders").select("source, total"),
    adminClient
      .from("orders")
      .select("id")
      .eq("source", "ai_guided")
      .gte(
        "createdAt",
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ).toISOString()
      ),
  ]);

  const direct = sourceStats?.filter((o) => o.source === "direct") ?? [];
  const aiGuided = sourceStats?.filter((o) => o.source === "ai_guided") ?? [];
  const avg = (arr: { total: string | number }[]) =>
    arr.length
      ? arr.reduce((s, o) => s + Number(o.total), 0) / arr.length
      : 0;

  const hasData = (sourceStats?.length ?? 0) > 0;

  return (
    <div>
      <h1 className="font-serif text-3xl text-text mb-2">Analitik</h1>
      <p className="text-sm text-secondary mb-8">
        AI Rehber vs Normal Yol karşılaştırması
      </p>

      {!hasData ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center">
          <p className="text-secondary">Henüz sipariş verisi yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* AI Yolu */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              <h2 className="font-serif text-xl text-text">AI Yolu</h2>
            </div>
            <dl className="flex flex-col gap-4">
              <div>
                <dt className="text-xs text-secondary mb-1">Toplam Sipariş</dt>
                <dd className="font-serif text-2xl text-text">
                  {aiGuided.length}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-secondary mb-1">
                  Ortalama Sepet Değeri
                </dt>
                <dd className="font-serif text-2xl text-text">
                  {avg(aiGuided).toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  ₺
                </dd>
              </div>
              <div>
                <dt className="text-xs text-secondary mb-1">
                  Bu Ay AI Siparişleri
                </dt>
                <dd className="font-serif text-2xl text-primary">
                  {thisMonthAI?.length ?? 0}
                </dd>
              </div>
            </dl>
          </div>

          {/* Normal Yol */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-secondary inline-block" />
              <h2 className="font-serif text-xl text-text">Normal Yol</h2>
            </div>
            <dl className="flex flex-col gap-4">
              <div>
                <dt className="text-xs text-secondary mb-1">Toplam Sipariş</dt>
                <dd className="font-serif text-2xl text-text">
                  {direct.length}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-secondary mb-1">
                  Ortalama Sepet Değeri
                </dt>
                <dd className="font-serif text-2xl text-text">
                  {avg(direct).toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  ₺
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
