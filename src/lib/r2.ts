import { S3Client, GetObjectCommand, DeleteObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "anibaski-uploads";

const DEFAULT_TTL = 60 * 60; // 1 saat

// path listesini R2 presigned URL'e çevirir.
// http(s)/data ile başlayanlar passthrough geçer (stüdyo çıktısı, eski kayıtlar).
export async function signR2Images(
  values: string[] | null | undefined,
  ttlSeconds = DEFAULT_TTL,
): Promise<string[]> {
  if (!values?.length) return [];
  return Promise.all(
    values.map((v) => {
      if (/^(https?:|data:)/i.test(v)) return v;
      return getSignedUrl(r2, new GetObjectCommand({ Bucket: R2_BUCKET, Key: v }), { expiresIn: ttlSeconds });
    }),
  );
}

// R2'ye dosya yükler, stabil key döner.
export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<void> {
  await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: body, ContentType: contentType }));
}

// R2'den dosya içeriğini Buffer olarak indirir.
export async function downloadFromR2(key: string): Promise<Buffer | null> {
  try {
    const res = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    const bytes = await res.Body?.transformToByteArray();
    return bytes ? Buffer.from(bytes) : null;
  } catch {
    return null;
  }
}

// Verilen path listesini R2'den siler. http/data passthrough değerleri atlanır.
export async function deleteFromR2(paths: string[]): Promise<void> {
  const keys = paths.filter((v) => v && !/^(https?:|data:)/i.test(v));
  if (!keys.length) return;
  await r2.send(
    new DeleteObjectsCommand({
      Bucket: R2_BUCKET,
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    }),
  );
}
