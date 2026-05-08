"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="ml-2 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
      >
        <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-xs flex items-center justify-center flex-shrink-0">
          {email[0].toUpperCase()}
        </span>
        <span className="hidden sm:block max-w-[120px] truncate">{email.split("@")[0]}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-hover)] z-20 overflow-hidden">
            <Link
              href="/siparisler"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
            >
              Siparişlerim
            </Link>
            <hr className="border-[var(--color-border)]" />
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </>
      )}
    </div>
  );
}
