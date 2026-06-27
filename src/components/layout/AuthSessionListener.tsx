"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthSessionListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        const newUserId = session?.user?.id;
        if (!newUserId) return;
        const cartUserId = localStorage.getItem("cart_user_id");
        if (cartUserId && cartUserId !== newUserId) {
          localStorage.removeItem("cart");
          window.dispatchEvent(new Event("cart-updated"));
        }
        localStorage.setItem("cart_user_id", newUserId);
      }
      if (event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
