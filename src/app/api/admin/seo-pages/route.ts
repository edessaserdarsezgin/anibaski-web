import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { PAGE_REGISTRY, getAllSeoPages } from "@/lib/seo";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const overrides = await getAllSeoPages();
  const pages = PAGE_REGISTRY.map((p) => {
    const o = overrides[p.path];
    return {
      path: p.path,
      label: p.label,
      defaultTitle: p.defaultTitle,
      defaultDescription: p.defaultDescription,
      title: o?.title ?? "",
      description: o?.description ?? "",
      ogImage: o?.ogImage ?? "",
    };
  });
  return NextResponse.json({ pages });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const path = String(body.path ?? "");
  if (!PAGE_REGISTRY.some((p) => p.path === path)) {
    return NextResponse.json({ error: "Geçersiz sayfa" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { error } = await supabase.from("seo_pages").upsert({
    path,
    title: String(body.title ?? ""),
    description: String(body.description ?? ""),
    og_image: String(body.ogImage ?? ""),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
