"use client";

import { useState, useRef, useEffect, useId } from "react";

export type SelectOption = { value: string; label: string; disabled?: boolean };

/**
 * Native <select> yerine kullanılan özel dropdown.
 * Kategori menüsüyle aynı görsel şablon: turuncu hover/seçim, açılır panel, dışarı tıkla/Escape kapat.
 * Native option hover'ı tarayıcıya bağlı olduğundan (CSS ile düzeltilemez) tüm select'lerde
 * tutarlı görünüm için bu bileşen kullanılır.
 */
export default function CustomSelect({
  value,
  onChange,
  options,
  disabled = false,
  className = "",
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Açılınca seçili öğeyi aktif yap
  useEffect(() => {
    if (open) setActiveIdx(options.findIndex((o) => o.value === value));
  }, [open, value, options]);

  function choose(v: string) {
    const opt = options.find((o) => o.value === v);
    if (opt?.disabled) return;
    onChange(v);
    setOpen(false);
  }

  // disabled olmayan bir sonraki/önceki indeks
  function nextEnabled(from: number, dir: 1 | -1) {
    let i = from;
    for (let n = 0; n < options.length; n++) {
      i += dir;
      if (i < 0 || i >= options.length) return from;
      if (!options[i].disabled) return i;
    }
    return from;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => nextEnabled(i, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => nextEnabled(i, -1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (activeIdx >= 0) choose(options[activeIdx].value);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`inline-flex items-center justify-between gap-2 outline-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          open ? "ring-1 ring-primary border-primary" : ""
        } ${className}`}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-3.5 h-3.5 shrink-0 transition-all duration-200 ${
            open ? "rotate-180 text-primary" : "text-text-light/60"
          }`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          id={listId}
          className="dropdown-enter absolute left-0 top-full mt-1.5 z-50 min-w-full w-max max-w-[16rem] origin-top bg-white border border-border rounded-xl shadow-hover p-1.5"
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            const isActive = i === activeIdx;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-disabled={o.disabled}
                disabled={o.disabled}
                onClick={() => choose(o.value)}
                onMouseEnter={() => !o.disabled && setActiveIdx(i)}
                className={`group/item flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  o.disabled
                    ? "text-text-light/40 cursor-not-allowed"
                    : isSelected
                    ? "text-primary font-semibold bg-primary/5"
                    : isActive
                    ? "text-primary bg-bg"
                    : "text-text-light"
                }`}
              >
                <span
                  className={`w-1 h-4 rounded-full transition-colors ${
                    isSelected || isActive ? "bg-primary" : "bg-transparent"
                  }`}
                  aria-hidden
                />
                <span className="truncate">{o.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
