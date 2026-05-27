import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const MOSAIC_TILES = [
  "#e07a5f", "#f2cc8f", "#d4856a", "#f8dfd4", "#c96b4f",
  "#f5a28a", "#fdfbf7", "#e07a5f", "#f2cc8f", "#d4856a",
  "#c96b4f", "#f8e8d0", "#f2cc8f", "#e07a5f", "#fdfbf7",
  "#f5a28a", "#d4856a", "#c96b4f", "#f8dfd4", "#e07a5f",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Fotoğraf mozaiği arka plan — tüm sayfayı kaplar */}
      <div
        aria-hidden="true"
        className="absolute inset-0 scale-110 -z-10"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          filter: "blur(28px) saturate(1.4) brightness(0.9)",
        }}
      >
        {MOSAIC_TILES.map((color, i) => (
          <div key={i} style={{ background: color }} />
        ))}
      </div>
      {/* Koyu overlay */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#3d405b]/50" />

      <header className="relative z-10 px-8 h-16 flex items-center border-b border-white/20 bg-white/15 backdrop-blur-sm">
        <Link href="/" className="font-serif text-2xl text-white drop-shadow-sm">
          Anı<span className="text-accent">Baskı</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
