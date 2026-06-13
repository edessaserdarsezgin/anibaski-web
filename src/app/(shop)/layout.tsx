import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import HeaderOffsetVar from "@/components/layout/HeaderOffsetVar";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBanner />
      <Header />
      <HeaderOffsetVar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
