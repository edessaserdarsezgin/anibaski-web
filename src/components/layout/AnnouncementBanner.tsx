import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";

export const revalidate = 60;

export default async function AnnouncementBanner() {
  const now = new Date().toISOString();
  const adminDb = createAdminClient();

  const { data: banner } = await adminDb
    .from("banners")
    .select("id, text, url, bgColor")
    .eq("isActive", true)
    .or(`startAt.is.null,startAt.lte.${now}`)
    .or(`endAt.is.null,endAt.gte.${now}`)
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!banner) return null;

  const content = (
    <span className="text-sm font-semibold text-white text-center px-4">
      {banner.text}
    </span>
  );

  return (
    <div
      className="w-full py-2.5 flex items-center justify-center"
      style={{ backgroundColor: banner.bgColor }}
    >
      {banner.url ? (
        <Link href={banner.url} className="hover:opacity-80 transition-opacity">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
