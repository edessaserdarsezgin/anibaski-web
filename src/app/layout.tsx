import type { Metadata } from "next";
import { Lora, Nunito } from "next/font/google";
import { ToastProvider } from "@/components/ui/ToastProvider";
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "AnıBaskı | Anılarınızı Dokunulur Kılın",
    template: "%s | AnıBaskı",
  },
  description:
    "Dijital anılarınızı fotoğraf baskısı, fotokitap, tablo ve kişisel hediyelere dönüştürün. Türkiye'nin en hızlı fotoğraf baskı platformu.",
  openGraph: {
    siteName: "AnıBaskı",
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${lora.variable} ${nunito.variable}`}>
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
