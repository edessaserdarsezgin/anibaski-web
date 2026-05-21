"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="ml-2 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full border border-border text-text hover:border-primary hover:text-primary transition-colors"
      >
        <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0">
          {email[0].toUpperCase()}
        </span>
        <span className="hidden sm:block max-w-[120px] truncate">{email.split("@")[0]}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-border shadow-hover z-20 overflow-hidden">
            <Link
              href="/profil"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-text hover:bg-bg transition-colors"
            >
              Profilim
            </Link>
            <Link
              href="/siparisler"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-text hover:bg-bg transition-colors"
            >
              Siparişlerim
            </Link>
            <hr className="border-border" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSignOut();
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            >
              Çıkış Yap
            </button>
          </div>
        </>
      )}
    </div>
  );
}
