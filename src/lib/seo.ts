import { createAdminClient } from "@/lib/supabase/server";

export type SeoSettings = {
  defaultTitle: string;
  siteName: string;
  description: string;
  ogImage: string;
  googleVerification: string;
  bingVerification: string;
};

export const SEO_DEFAULTS: SeoSettings = {
  defaultTitle: "AnıBaskı | Anılarınızı Dokunulur Kılın",
  siteName: "AnıBaskı",
  description:
    "Dijital anılarınızı fotoğraf baskısı, fotokitap, tablo ve kişisel hediyelere dönüştürün. Türkiye'nin en hızlı fotoğraf baskı platformu.",
  ogImage: "",
  googleVerification: "",
  bingVerification: "",
};

export async function getSeoSettings(): Promise<SeoSettings> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("data")
      .eq("id", 1)
      .single();
    return { ...SEO_DEFAULTS, ...((data?.data as Partial<SeoSettings>) ?? {}) };
  } catch {
    return SEO_DEFAULTS;
  }
}
