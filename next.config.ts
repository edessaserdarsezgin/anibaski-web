import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["lecherously-fussy-everleigh.ngrok-free.dev"],
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  images: {
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

export default nextConfig;
