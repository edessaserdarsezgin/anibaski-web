"use client";

import { useState } from "react";

export type FaqItem = { q: string; a: React.ReactNode };

export default function FaqCategory({ id, title, items }: { id: string; title: string; items: FaqItem[] }) {
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setOpenSet((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });

  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-serif text-2xl text-text mb-4">{title}</h2>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {items.map((item, i) => {
          const isOpen = openSet.has(i);
          return (
            <div key={i} className="border-b border-border last:border-0">
              <button
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-bg transition-colors"
              >
                <span className="text-sm font-semibold text-text">{item.q}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                  className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180 text-primary" : "text-text-light"}`}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-5 pb-4 text-sm text-text-light leading-relaxed [&_a]:text-primary [&_a]:font-semibold [&_a:hover]:underline">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
