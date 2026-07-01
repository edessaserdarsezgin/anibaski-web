import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/orders/updateStatus";

// Toplu durum güncelleme — [ids] siparişlerine tek durum uygular.
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ids, status } = await req.json();
  if (!Array.isArray(ids) || !ids.length) {
    return NextResponse.json({ error: "ids gerekli" }, { status: 400 });
  }

  let updated = 0;
  const failed: string[] = [];
  for (const id of ids) {
    const result = await updateOrderStatus(admin, id, status);
    if (result.ok) updated++;
    else failed.push(id);
  }

  return NextResponse.json({ updated, failed });
}
