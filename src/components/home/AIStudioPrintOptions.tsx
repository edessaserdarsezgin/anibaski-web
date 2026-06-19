import Link from "next/link";

const OPTIONS = [
  {
    icon: "🖼️",
    name: "Fotoğraf Baskısı",
    desc: "Mat veya parlak kağıtta, her boyutta.",
    href: "/kategoriler/klasik-baskilar",
    badge: "En Çok Tercih",
    badgeColor: "bg-primary/10 text-primary",
    gradient: "from-rose-50 to-orange-50",
    border: "border-rose-100",
  },
  {
    icon: "🎨",
    name: "Kanvas Tablo",
    desc: "Duvara asılmaya hazır, gergin kanvas.",
    href: "/kategoriler/kanvas-tablolar",
    badge: "Duvar Dekor",
    badgeColor: "bg-violet-100 text-violet-700",
    gradient: "from-violet-50 to-purple-50",
    border: "border-violet-100",
  },
  {
    icon: "☕",
    name: "Kupa Baskı",
    desc: "Kişiye özel fotoğraflı kupa, sevdiklerine.",
    href: "/kategoriler/kupalar",
    badge: "Hediyelik",
    badgeColor: "bg-amber-100 text-amber-700",
    gradient: "from-amber-50 to-yellow-50",
    border: "border-amber-100",
  },
  {
    icon: "🪟",
    name: "Cam Baskı",
    desc: "Işıkta parıldayan modern cam tablo.",
    href: "/kategoriler/cam-baski",
    badge: "Hediyelik",
    badgeColor: "bg-amber-100 text-amber-700",
    gradient: "from-sky-50 to-blue-50",
    border: "border-sky-100",
  },
  {
    icon: "🖼️",
    name: "Çerçeveli Baskı",
    desc: "Anında hazır, hediye kutusunda.",
    href: "/kategoriler/cerceveler",
    badge: "Hediyelik",
    badgeColor: "bg-amber-100 text-amber-700",
    gradient: "from-emerald-50 to-teal-50",
    border: "border-emerald-100",
  },
  {
    icon: "🧲",
    name: "Magnet",
    desc: "Buzdolabına, küçük ama anlamlı.",
    href: "/kategoriler/magnetler",
    badge: "Hediyelik",
    badgeColor: "bg-amber-100 text-amber-700",
    gradient: "from-pink-50 to-rose-50",
    border: "border-pink-100",
  },
];

export default function AIStudioPrintOptions() {
  return (
    <section className="py-20 px-4 sm:px-8 bg-bg border-t border-border">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-12">
          <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            AI Stüdyo &rarr; Baskı
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-text">
            İşlediğin görseli ne üzerine bastıralım?
          </h2>
          <p className="text-secondary mt-3 text-sm max-w-lg mx-auto">
            AI Stüdyo&apos;da hazırladığın fotoğrafı tek tıkla aşağıdaki ürünlerden birine gönder —
            hediyelik ya da dekorasyon, seçim senin.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {OPTIONS.map((opt) => (
            <Link
              key={opt.name}
              href={opt.href}
              className={`group flex flex-col gap-3 p-5 rounded-2xl bg-gradient-to-br ${opt.gradient} border ${opt.border} hover:shadow-soft hover:-translate-y-0.5 transition-all`}
            >
              <span className="text-3xl">{opt.icon}</span>
              <div className="flex flex-col gap-1 flex-1">
                <p className="font-semibold text-text text-sm leading-tight">{opt.name}</p>
                <p className="text-text-light text-[11px] leading-snug">{opt.desc}</p>
              </div>
              <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full ${opt.badgeColor}`}>
                {opt.badge}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/studyo"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            AI Stüdyo&apos;da fotoğrafını işle, sonra buraya geri dön ✨
          </Link>
        </div>

      </div>
    </section>
  );
}
