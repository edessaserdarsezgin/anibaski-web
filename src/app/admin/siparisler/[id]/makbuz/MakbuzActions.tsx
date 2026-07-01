"use client";

export default function MakbuzActions() {
  return (
    <div className="no-print flex items-center gap-3 mb-6">
      <button
        onClick={() => window.print()}
        className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-full transition-colors"
      >
        🖨️ Yazdır
      </button>
      <button
        onClick={() => window.close()}
        className="px-5 py-2.5 border border-border text-text-light hover:text-text text-sm font-semibold rounded-full transition-colors"
      >
        Kapat
      </button>
      <span className="text-xs text-text-light">İpucu: Yazdır → hedef yazıcı/PDF seç</span>
    </div>
  );
}
