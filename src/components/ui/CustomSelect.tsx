"use client";

import { useState, useRef, useEffect, useId, useCallback } from "react";
import { createPortal } from "react-dom";

export type SelectOption = { value: string; label: string; disabled?: boolean };

type Rect = { left: number; top: number; bottom: number; width: number };

/**
 * Native <select> yerine kullanılan özel dropdown.
 * Kategori menüsüyle aynı görsel şablon: turuncu hover/seçim, açılır panel, dışarı tıkla/Escape kapat.
 * Native option hover'ı tarayıcıya bağlı olduğundan (CSS ile düzeltilemez) tüm select'lerde
 * tutarlı görünüm için bu bileşen kullanılır.
 *
 * Açılır panel `document.body`'ye portal + `position: fixed` ile çizilir; böylece tablo/scroll
 * gibi overflow konteynerleri paneli kırpamaz (yön/konum hesabı gerekmez).
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
  const [rect, setRect] = useState<Rect | null>(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);

  useEffect(() => setMounted(true), []);

  const measure = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setRect({ left: r.left, top: r.top, bottom: r.bottom, width: r.width });
  }, []);

  function toggleOpen() {
    if (disabled) return;
    if (!open) measure();
    setOpen((o) => !o);
  }

  // Dışarı tıkla / Escape / scroll / resize → kapat
  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: PointerEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onScrollOrResize() {
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDocPointer);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointer);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      document.removeEventListener("keydown", onKey);
    };
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
      toggleOpen();
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

  // Panel konumu: butonun altında yeterli yer yoksa üstüne hizala (viewport taşmasını önler).
  const panelMaxH = 288;
  const spaceBelow = rect ? window.innerHeight - rect.bottom : 0;
  const flipUp = !!rect && spaceBelow < panelMaxH && rect.top > spaceBelow;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
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

      {mounted && open && rect &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            id={listId}
            style={{
              position: "fixed",
              left: rect.left,
              minWidth: rect.width,
              maxHeight: panelMaxH,
              ...(flipUp
                ? { bottom: window.innerHeight - rect.top + 6 }
                : { top: rect.bottom + 6 }),
            }}
            className="dropdown-enter z-[100] w-max max-w-[18rem] overflow-y-auto bg-white border border-border rounded-xl shadow-hover p-1.5"
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
          </div>,
          document.body
        )}
    </>
  );
}
