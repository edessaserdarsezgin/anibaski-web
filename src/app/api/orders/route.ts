import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { address, paymentMethod, items, subtotal, shippingFee, total } = body;

  // Profil yoksa oluştur
  await prisma.profile.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email!,
      fullName: user.user_metadata?.full_name ?? null,
    },
  });

  // Adresi kaydet
  const savedAddress = await prisma.address.create({
    data: {
      userId: user.id,
      title: "Teslimat Adresi",
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      district: address.district,
      zip: address.zip ?? null,
    },
  });

  // Siparişi oluştur
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      addressId: savedAddress.id,
      paymentMethod,
      subtotal,
      shippingFee,
      total,
      items: {
        create: items.map((item: {
          productId: string;
          variantSelections: Record<string, unknown>;
          quantity: number;
          unitPrice: number;
        }) => ({
          productId: item.productId,
          variantSelections: item.variantSelections ?? {},
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
  });

  return NextResponse.json({ orderId: order.id });
}
