import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/orders/updateStatus";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json();

  const result = await updateOrderStatus(admin, id, status);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.code });

  return NextResponse.json(result.order);
}
