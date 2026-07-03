import type { Metadata } from "next";
import { Lora, Nunito } from "next/font/google";
import { ToastProvider } from "@/components/ui/ToastProvider";
import CookieBanner from "@/components/layout/CookieBanner";
import AuthSessionListener from "@/components/layout/AuthSessionListener";
import { getSeoSettings } from "@/lib/seo";
import "./globals.css";

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: {
      default: seo.defaultTitle,
      template: `%s | ${seo.siteName}`,
    },
    description: seo.description,
    alternates: {
      canonical: "https://anibaski.com",
    },
    openGraph: {
      siteName: seo.siteName,
      locale: "tr_TR",
      type: "website",
      ...(seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
    },
    ...((seo.googleVerification || seo.bingVerification)
      ? {
          verification: {
            ...(seo.googleVerification ? { google: seo.googleVerification } : {}),
            ...(seo.bingVerification ? { other: { "msvalidate.01": seo.bingVerification } } : {}),
          },
        }
      : {}),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${lora.variable} ${nunito.variable}`} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthSessionListener />
        <ToastProvider>{children}</ToastProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
