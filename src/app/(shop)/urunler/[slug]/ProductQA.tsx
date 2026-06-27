import { createAdminClient } from "@/lib/supabase/server";
import QuestionForm from "./QuestionForm";

type QAItem = {
  id: string;
  question: string;
  answer: string;
  answeredAt: string;
  createdAt: string;
  profile: { fullName: string | null } | null;
};

export default async function ProductQA({
  productId,
  slug,
  userId,
}: {
  productId: string;
  slug: string;
  userId: string | null;
}) {
  const admin = createAdminClient();

  const { data } = await admin
    .from("product_questions")
    .select(`id, question, answer, "answeredAt", "createdAt", profile:profiles!product_questions_userId_fkey("fullName")`)
    .eq("productId", productId)
    .eq("isVisible", true)
    .not("answer", "is", null)
    .order("createdAt", { ascending: false });

  const items = (data ?? []) as unknown as QAItem[];

  function maskName(fullName: string | null | undefined): string {
    if (!fullName) return "Kullanıcı";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
  }

  return (
    <section className="mt-10 pt-8 border-t border-border">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <h2 className="font-serif text-2xl text-text">
          Soru & Cevap
          {items.length > 0 && (
            <span className="ml-2 text-base font-sans font-normal text-text-light">({items.length})</span>
          )}
        </h2>
        <QuestionForm slug={slug} isLoggedIn={!!userId} />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-text-light bg-bg border border-border rounded-xl px-5 py-6 text-center">
          Henüz cevaplanmış soru yok. İlk soruyu siz sorun!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-border rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-primary font-bold text-lg leading-none mt-0.5">S</span>
                <div>
                  <p className="text-sm text-text">{item.question}</p>
                  <p className="text-xs text-text-light mt-1">
                    {maskName(item.profile?.fullName)} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
                <span className="text-primary font-bold text-lg leading-none mt-0.5">C</span>
                <p className="text-sm text-text leading-relaxed">{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
