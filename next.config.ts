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
    ],
  },
};

export default nextConfig;
