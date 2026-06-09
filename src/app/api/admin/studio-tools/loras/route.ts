import { NextResponse } from "next/server";
import { getEditLoras } from "@/lib/aiEdit";
import { requireAdmin } from "@/lib/auth";

// Admin formundaki LoRA dropdown'u — Space'in canlı adaptör listesi.
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return NextResponse.json(await getEditLoras());
  } catch {
    return NextResponse.json([]);
  }
}
