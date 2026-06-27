"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function cartKey(userId: string) {
  return `cart_user_${userId}`;
}

export default function AuthSessionListener() {
  const router = useRouter();
  const currentUserRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id ?? null;

      if ((event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") && userId) {
        currentUserRef.current = userId;
      }

      if (event === "SIGNED_IN" && userId) {
        currentUserRef.current = userId;
        // Kullanıcının kaydedilmiş sepeti varsa geri yükle
        const saved = localStorage.getItem(cartKey(userId));
        if (saved !== null) {
          localStorage.setItem("cart", saved);
          window.dispatchEvent(new Event("cart-updated"));
        }
      }

      if (event === "SIGNED_OUT") {
        if (currentUserRef.current) {
          // Mevcut sepeti kullanıcı anahtarına kaydet, sonra temizle
          const cart = localStorage.getItem("cart") ?? "[]";
          localStorage.setItem(cartKey(currentUserRef.current), cart);
          localStorage.removeItem("cart");
          window.dispatchEvent(new Event("cart-updated"));
          currentUserRef.current = null;
        }
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
