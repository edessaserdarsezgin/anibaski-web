type Specs = Record<string, unknown> | null;

type Props = {
  specs: Specs;
  description: string;
};

export default function ProductDetailsTabs({ specs, description }: Props) {
  const text = (specs as { details?: string } | null)?.details ?? "";
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  const hasDescription = description.trim().length > 0;
  const hasDetails = lines.length > 0;

  if (!hasDescription && !hasDetails) return null;

  return (
    <section aria-labelledby="product-details-heading" className="mt-16 border-t border-border pt-10">
      <div className={`grid gap-10 ${hasDescription && hasDetails ? "lg:grid-cols-2" : "grid-cols-1"}`}>

        {hasDescription && (
          <div>
            <h2 id="product-details-heading" className="font-serif text-2xl text-text mb-5 flex items-center gap-3">
              <span aria-hidden="true" className="inline-block w-1 h-6 rounded-full bg-primary" />
              Ürün Hakkında
            </h2>
            <div className="p-5 rounded-2xl bg-bg border border-border">
              <p className="text-sm text-text leading-relaxed whitespace-pre-line">{description}</p>
            </div>
          </div>
        )}

        {hasDetails && (
          <div>
            <h2
              id={hasDescription ? undefined : "product-details-heading"}
              className="font-serif text-2xl text-text mb-5 flex items-center gap-3"
            >
              <span aria-hidden="true" className="inline-block w-1 h-6 rounded-full bg-primary" />
              Ürün Detayları
            </h2>
            <ul className="flex flex-col gap-2.5">
              {lines.map((line, i) => (
                <li key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-bg border border-border">
                  <span aria-hidden="true" className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-primary">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-sm text-text leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </section>
  );
}
