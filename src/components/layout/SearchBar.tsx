"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Result = {
  id: string;
  name: string;
  slug: string;
  images: string[] | null;
  basePrice: number;
  category: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function clearSearch() {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  // Dış tıklamada kapat
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced live search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setOpen(false);
    router.push(`/arama?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => { if (e.key === "Escape") clearSearch(); }}
            aria-label="Ürün ara"
            placeholder="Ürün ara..."
            className="w-full pl-10 pr-10 py-2 rounded-full border border-border bg-white text-sm outline-none focus:border-primary transition-colors"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light pointer-events-none"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Aramayı temizle"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border/60 hover:bg-primary hover:text-white text-text-light flex items-center justify-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-border shadow-xl overflow-hidden z-50">
          {loading ? (
            <p className="px-4 py-6 text-sm text-text-light text-center">Aranıyor...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-text-light text-center">
              &quot;{query}&quot; için sonuç bulunamadı.
            </p>
          ) : (
            <>
              {results.map((r) => {
                const cat = Array.isArray(r.category) ? r.category[0] : r.category;
                return (
                  <Link
                    key={r.id}
                    href={`/urunler/${r.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-bg transition-colors border-b border-border last:border-0"
                  >
                    <div className="relative w-12 h-12 rounded-lg bg-bg border border-border shrink-0 overflow-hidden">
                      {r.images?.[0] ? (
                        <Image src={r.images[0]} alt={r.name} fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{r.name}</p>
                      {cat && <p className="text-xs text-text-light">{cat.name}</p>}
                    </div>
                    <p className="text-sm font-semibold text-primary shrink-0">
                      {Number(r.basePrice).toLocaleString("tr-TR")} ₺
                    </p>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full px-4 py-3 text-sm font-semibold text-primary bg-bg hover:bg-border/40 transition-colors text-center"
              >
                Tüm sonuçları gör →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
