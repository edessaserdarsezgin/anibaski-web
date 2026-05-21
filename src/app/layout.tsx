import type { Metadata } from "next";
import { Lora, Nunito } from "next/font/google";
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
  title: "AnıBaskı | Anılarınızı Dokunulur Kılın",
  description:
    "Dijital anılarınızı fotoğraf baskısı, fotokitap, tablo ve kişisel hediyelere dönüştürün.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${lora.variable} ${nunito.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
