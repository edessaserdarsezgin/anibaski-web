import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["lecherously-fussy-everleigh.ngrok-free.dev"],
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  images: {
    minimumCacheTTL: 2592000, // 30 gün — ürün görselleri nadiren değişir, URL değişirse zaten yeni transform
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dsxlrkkkyvltdapoizks.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
  },
  // Güvenlik HTTP header'ları (tüm yollar). CSP bilinçli eklenmedi (ayrı test ister).
  // X-Frame-Options=SAMEORIGIN: sitenin başka sitelerce iframe'e gömülmesini engeller
  // (clickjacking). PayTR'yi etkilemez — orada bizim sayfa üst-frame, PayTR çocuk-frame.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.anibaski.com" }],
        destination: "https://anibaski.com/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Kaynak haritası yükleme (okunur stack trace) — token yoksa sessizce atlanır
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Ad-blocker'ları aşmak için Sentry isteklerini kendi sunucumuz üzerinden geçir
  tunnelRoute: "/monitoring",
});
