import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/urunler", "/kategoriler"],
        disallow: ["/admin", "/sepet", "/odeme", "/siparisler", "/profil", "/fotograf-yukle", "/giris", "/kayit"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
