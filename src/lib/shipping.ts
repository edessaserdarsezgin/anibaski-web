import { createAdminClient } from "@/lib/supabase/server";

export type ShippingSettings = {
  shippingFee: number;
  freeShippingThreshold: number;
  codFee: number;
};

export const SHIPPING_DEFAULTS: ShippingSettings = {
  shippingFee: 49,
  freeShippingThreshold: 500,
  codFee: 30,
};

export async function getShippingSettings(): Promise<ShippingSettings> {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("shipping_settings")
      .select("shipping_fee, free_shipping_threshold, cod_fee")
      .eq("id", 1)
      .single();
    if (!data) return SHIPPING_DEFAULTS;
    return {
      shippingFee: Number(data.shipping_fee),
      freeShippingThreshold: Number(data.free_shipping_threshold),
      codFee: Number(data.cod_fee),
    };
  } catch {
    return SHIPPING_DEFAULTS;
  }
}
