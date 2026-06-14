import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import HeaderOffsetVar from "@/components/layout/HeaderOffsetVar";
import CategoryIconStrip from "@/components/layout/CategoryIconStrip";
import { getNavCategories } from "@/lib/catalog";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const navCategories = await getNavCategories();
  return (
    <>
      <AnnouncementBanner />
      <Header />
      <HeaderOffsetVar />
      <CategoryIconStrip categories={navCategories} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
