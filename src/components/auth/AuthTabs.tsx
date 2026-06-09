import Link from "next/link";

/** Sosyopix tarzı segmentli geçiş — Giriş Yap | Üye Ol. Aktif olmayan sekme diğer sayfaya götürür. */
export default function AuthTabs({ active }: { active: "giris" | "kayit" }) {
  const base = "flex-1 text-center py-2.5 rounded-full text-sm font-semibold transition-colors";
  const on = "bg-primary text-white shadow-sm";
  const off = "text-text-light hover:text-text";
  return (
    <div className="flex gap-1 p-1 bg-bg rounded-full border border-border mb-7">
      <Link href="/giris" aria-current={active === "giris" ? "page" : undefined}
        className={`${base} ${active === "giris" ? on : off}`}>
        Giriş Yap
      </Link>
      <Link href="/kayit" aria-current={active === "kayit" ? "page" : undefined}
        className={`${base} ${active === "kayit" ? on : off}`}>
        Üye Ol
      </Link>
    </div>
  );
}
