"use client";

import { useState } from "react";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-square bg-bg rounded-2xl border border-border flex items-center justify-center">
        <span className="text-text-light text-sm">Görsel yok</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Ana görsel */}
      <div className="aspect-square bg-bg rounded-2xl border border-border overflow-hidden">
        <img src={images[active]} alt={name} className="w-full h-full object-cover" />
      </div>

      {/* Küçük resimler */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-colors ${
                i === active
                  ? "border-primary"
                  : "border-border hover:border-primary opacity-70 hover:opacity-100"
              }`}
            >
              <img src={url} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
