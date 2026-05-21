import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="px-8 h-16 flex items-center border-b border-border">
        <Link href="/" className="font-serif text-2xl text-text">
          Anı<span className="text-primary">Baskı</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
