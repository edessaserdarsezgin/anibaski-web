const REVIEWS = [
  {
    name: "Ayşe K.",
    city: "İstanbul",
    product: "Kanvas Tablo",
    stars: 5,
    text: "Düğün fotoğrafımızı kanvasa bastırdım. Renkleri inanılmaz canlı çıktı, oturma odamızın tam odak noktası oldu.",
    initials: "AK",
    bg: "bg-rose-100",
    fg: "text-rose-700",
  },
  {
    name: "Mert Ö.",
    city: "Ankara",
    product: "Fotokitap",
    stars: 5,
    text: "Tatil fotoğraflarımızı fotokitaba dönüştürdük. Kalitesi gerçekten beklentimin üzerindeydi. Annem ağladı!",
    initials: "MÖ",
    bg: "bg-sky-100",
    fg: "text-sky-700",
  },
  {
    name: "Selin T.",
    city: "İzmir",
    product: "Polaroid Baskı",
    stars: 5,
    text: "Arkadaşıma doğum günü sürprizi için sipariş verdim. 3 günde geldi, paketi bile çok şıktı. Kesinlikle tekrar alacağım.",
    initials: "ST",
    bg: "bg-amber-100",
    fg: "text-amber-700",
  },
  {
    name: "Emre B.",
    city: "Bursa",
    product: "Çerçeveli Baskı",
    stars: 5,
    text: "Çocuklarımın fotoğraflarını çerçeveli baskı yaptırdım. Hem kalite hem hız hem de fiyat açısından çok memnun kaldım.",
    initials: "EB",
    bg: "bg-violet-100",
    fg: "text-violet-700",
  },
];

export default function TestimonialsStrip() {
  return (
    <section className="py-24 px-4 sm:px-8 bg-bg">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-4">Müşterilerimiz</p>
          <h2 className="font-serif text-3xl md:text-5xl text-text">Onlar anlatsın</h2>
          <p className="text-text-light mt-4 text-sm">
            50.000+ siparişten gerçek geri bildirimler
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {REVIEWS.map((r) => (
            <div
              key={r.name}
              className="bg-white rounded-2xl border border-border p-6 flex flex-col gap-4 hover:shadow-soft transition-shadow"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-accent fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Review text */}
              <p className="text-sm text-text leading-relaxed flex-1">"{r.text}"</p>

              {/* Divider */}
              <div className="border-t border-border pt-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${r.bg} ${r.fg} flex items-center justify-center text-xs font-bold shrink-0`}>
                  {r.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">{r.name}</p>
                  <p className="text-xs text-text-light">{r.product} · {r.city}</p>
                </div>
                <span className="ml-auto text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                  ✓ Doğrulandı
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
