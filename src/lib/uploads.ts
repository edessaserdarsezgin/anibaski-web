import { signR2Images } from "@/lib/r2";

// order_items.uploadedImages stabil R2 key tutar.
// Görüntüleme/indirme anında presigned URL üretilir.
// http(s)/data ile başlayanlar (stüdyo çıktısı, eski kayıtlar) olduğu gibi geçer.
export async function signUploadedImages(
  values: string[] | null | undefined,
  ttlSeconds = 60 * 60,
): Promise<string[]> {
  return signR2Images(values, ttlSeconds);
}
