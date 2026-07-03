import type { Metadata } from "next";
import { Lora, Nunito } from "next/font/google";
import { ToastProvider } from "@/components/ui/ToastProvider";
import CookieBanner from "@/components/layout/CookieBanner";
import AuthSessionListener from "@/components/layout/AuthSessionListener";
import { getSeoSettings, getSeoPage, PAGE_REGISTRY } from "@/lib/seo";
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
  const [seo, home] = await Promise.all([getSeoSettings(), getSeoPage("/")]);
  const homeReg = PAGE_REGISTRY.find((p) => p.path === "/");
  const homeTitle = (home?.title || homeReg?.defaultTitle || seo.siteName).trim();
  const homeDesc = (home?.description || homeReg?.defaultDescription || seo.defaultDescription).trim();
  const ogImage = home?.ogImage || seo.defaultOgImage;
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: {
      default: homeTitle,
      template: `%s | ${seo.siteName}`,
    },
    description: homeDesc,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      siteName: seo.siteName,
      locale: "tr_TR",
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
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
