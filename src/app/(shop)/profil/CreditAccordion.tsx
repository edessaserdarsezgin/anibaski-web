"use client";

import { useState } from "react";
import Link from "next/link";
import CreditStatsView from "@/components/studio/CreditStatsView";

type Credits = {
  total: number;
  trial: boolean;
  dailyFreeRemaining: number;
  earnedAvailable: number;
};

export default function CreditAccordion({
  credits,
  creditStats,
}: {
  credits: Credits;
  creditStats: React.ComponentProps<typeof CreditStatsView>["stats"];
}) {
  const [open, setOpen] = useState(false);

  const shortSummary =
    credits.total > 0
      ? credits.trial
        ? `Ücretsiz deneme: ${credits.dailyFreeRemaining} hak`
        : `${credits.total} kullanım hakkın var`
      : credits.trial
        ? "Deneme hakkın doldu"
        : "Hakkın doldu";

  return (
    <section className="bg-white rounded-2xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-bg transition-colors"
      >
        <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-text">AI Stüdyo Kredilerim</span>
          <span className="block text-xs text-text-light truncate">{shortSummary}</span>
        </span>
        <svg className={`w-4 h-4 text-text-light shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25 12 15.75 4.5 8.25" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm text-text-light mb-4">
            {credits.total > 0 ? (
              credits.trial ? (
                <>Ücretsiz deneme hakkın: <b className="text-primary">{credits.dailyFreeRemaining}</b>. Beğenirsen baskıya geç — ilk siparişinden sonra her gün ücretsiz kredi kazanırsın 🎁</>
              ) : (
                <>Şu an <b className="text-primary">{credits.total}</b> kullanım hakkın var
                  {" "}(bugün <b className="text-text">{credits.dailyFreeRemaining}</b> ücretsiz
                  {credits.earnedAvailable > 0 && <> + <b className="text-text">{credits.earnedAvailable}</b> kazanılmış</>}).</>
              )
            ) : (
              credits.trial ? (
                <>Deneme hakkın doldu — bir baskı siparişi ver, her gün ücretsiz kredi kazanmaya başla 🎁</>
              ) : (
                <>Hakkın doldu — her 1000 ₺&apos;lik baskı siparişinde yeni kredi kazanırsın 🎁</>
              )
            )}
          </p>
          <CreditStatsView stats={creditStats} />
          <Link href="/studyo" className="mt-4 inline-block text-sm text-primary hover:underline font-semibold">
            Stüdyoya git →
          </Link>
        </div>
      )}
    </section>
  );
}
