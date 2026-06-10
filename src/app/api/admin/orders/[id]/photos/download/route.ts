import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { requireAdmin } from "@/lib/auth";
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const { data: items } = await admin.supabase
    .from("order_items")
    .select("uploadedImages, product:products(name)")
    .eq("orderId", id);

  const zip = new JSZip();
  let fileIndex = 1;

  for (const item of items ?? []) {
    const productName = ((item.product as unknown as { name: string } | null)?.name ?? "urun")
      .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, "").trim().replace(/\s+/g, "_");

    const images: string[] = item.uploadedImages ?? [];
    for (const value of images) {
      try {
        let buffer: ArrayBuffer | null = null;
        let ext = "jpg";
        if (/^https?:\/\//i.test(value)) {
          // Stüdyo çıktısı / eski tam URL → doğrudan indir
          const res = await fetch(value);
          if (!res.ok) continue;
          buffer = await res.arrayBuffer();
          ext = value.split("?")[0].split(".").pop() ?? "jpg";
        } else {
          // Stabil path → admin client ile storage'tan indir (imzaya gerek yok)
          const { data, error } = await admin.supabase.storage.from("uploads").download(value);
          if (error || !data) continue;
          buffer = await data.arrayBuffer();
          ext = value.split(".").pop() ?? "jpg";
        }
        zip.file(`${String(fileIndex).padStart(3, "0")}_${productName}.${ext}`, buffer);
        fileIndex++;
      } catch {
        // erişilemedi, atla
      }
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const shortId = id.slice(0, 8).toUpperCase();

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="siparis-${shortId}-fotograflar.zip"`,
    },
  });
}
