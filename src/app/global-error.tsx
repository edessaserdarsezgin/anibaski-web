"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="tr">
      <body style={{ fontFamily: "sans-serif", padding: "3rem", textAlign: "center", color: "#3d405b" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Bir şeyler ters gitti</h1>
        <p style={{ color: "#8187a2", marginBottom: "1.5rem" }}>Beklenmedik bir hata oluştu. Lütfen sayfayı yenileyin.</p>
        {/* Bilerek <Link> DEĞİL: global-error, kök layout çöktüğünde devreye giren son çare.
            İstemci tarafı yönlendirme bozuk React ağacını korur; tam sayfa yenileme
            uygulamayı sıfırdan ayağa kaldırır — kurtarma yolunun kendisi budur. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" style={{ color: "#e07a5f", fontWeight: 600 }}>Ana sayfaya dön</a>
      </body>
    </html>
  );
}
