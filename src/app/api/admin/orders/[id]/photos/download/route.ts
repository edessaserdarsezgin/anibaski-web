import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import JSZip from "jszip";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "ADMIN") return null;
  return { user, supabase: createAdminClient() };
}

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
    const productName = ((item.product as { name: string } | null)?.name ?? "urun")
      .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, "").trim().replace(/\s+/g, "_");

    const images: string[] = item.uploadedImages ?? [];
    for (const url of images) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buffer = await res.arrayBuffer();
        const ext = url.split("?")[0].split(".").pop() ?? "jpg";
        zip.file(`${String(fileIndex).padStart(3, "0")}_${productName}.${ext}`, buffer);
        fileIndex++;
      } catch {
        // URL süresi dolmuş olabilir, atla
      }
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const shortId = id.slice(0, 8).toUpperCase();

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="siparis-${shortId}-fotograflar.zip"`,
    },
  });
}
