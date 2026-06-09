import { NextRequest, NextResponse } from "next/server";
import { getCreditStatus, getCreditStats, adjustCredits } from "@/lib/studioCredits";
import { requireAdmin } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [status, stats] = await Promise.all([getCreditStatus(id), getCreditStats(id)]);
  return NextResponse.json({ ...status, stats });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { delta, note } = await req.json();
  if (typeof delta !== "number" || delta === 0) {
    return NextResponse.json({ error: "Geçersiz miktar" }, { status: 400 });
  }
  await adjustCredits(id, delta, typeof note === "string" ? note : undefined);
  const [status, stats] = await Promise.all([getCreditStatus(id), getCreditStats(id)]);
  return NextResponse.json({ ...status, stats });
}
