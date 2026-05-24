import Link from "next/link";

const POLICIES = [
  { href: "/politikalar/gizlilik", label: "Gizlilik & KVKK" },
  { href: "/politikalar/mesafeli-satis-sozlesmesi", label: "Mesafeli Satış Sözleşmesi" },
  { href: "/politikalar/iptal-iade", label: "İptal ve İade" },
  { href: "/politikalar/kullanim-kosullari", label: "Kullanım Koşulları" },
];

export default function PolitikalarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="lg:w-56 flex-shrink-0">
          <h2 className="font-serif text-sm font-semibold text-text mb-3">Yasal Belgeler</h2>
          <nav className="flex flex-col gap-1">
            {POLICIES.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="text-sm text-text-light hover:text-primary px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
              >
                {p.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0 prose prose-sm max-w-none
          prose-headings:font-serif prose-headings:text-text
          prose-p:text-text-light prose-li:text-text-light
          prose-strong:text-text prose-a:text-primary">
          {children}
        </main>
      </div>
    </div>
  );
}
