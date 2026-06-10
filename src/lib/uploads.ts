import { createAdminClient } from "@/lib/supabase/server";

// uploads bucket private. order_items.uploadedImages artık stabil storage PATH'i
// tutar (eskiden 7 günlük signed URL yazılıyordu → 7 gün sonra ölüyordu).
// Görüntüleme/indirme anında imzalanır.
const DEFAULT_TTL = 60 * 60; // 1 saat — okuma anında üretildiği için kısa yeter

// path listesini imzalı görüntülenebilir URL'lere çevirir.
// http(s)/data ile başlayanlar (stüdyo çıktısı, eski tam URL kayıtları) olduğu gibi
// geçer → geriye dönük uyumlu.
export async function signUploadedImages(
  values: string[] | null | undefined,
  ttlSeconds: number = DEFAULT_TTL,
): Promise<string[]> {
  if (!values?.length) return [];
  const out = [...values];
  const toSign: { idx: number; path: string }[] = [];
  values.forEach((v, i) => {
    if (!/^(https?:|data:)/i.test(v)) toSign.push({ idx: i, path: v });
  });
  if (toSign.length) {
    const admin = createAdminClient();
    const { data } = await admin.storage
      .from("uploads")
      .createSignedUrls(toSign.map((t) => t.path), ttlSeconds);
    (data ?? []).forEach((res, k) => {
      if (res?.signedUrl) out[toSign[k].idx] = res.signedUrl;
    });
  }
  return out;
}
