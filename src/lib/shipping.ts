import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export type ShippingSettings = {
  shippingFee: number;
  freeShippingThreshold: number;
  codFee: number;
  productionTime: string;
  shippingTime: string;
  orderCutoffNote: string;
};

export const SHIPPING_DEFAULTS: ShippingSettings = {
  shippingFee: 49,
  freeShippingThreshold: 500,
  codFee: 30,
  productionTime: "2–3 iş günü",
  shippingTime: "1–3 iş günü",
  orderCutoffNote: "Siparişler hafta içi 14:00'a kadar verilirse aynı gün üretime alınır.",
};

export const getShippingSettings = unstable_cache(
  async (): Promise<ShippingSettings> => {
    try {
      const supabase = await createAdminClient();
      const { data } = await supabase
        .from("shipping_settings")
        .select("shipping_fee, free_shipping_threshold, cod_fee, production_time, shipping_time, order_cutoff_note")
        .eq("id", 1)
        .single();
      if (!data) return SHIPPING_DEFAULTS;
      return {
        shippingFee: Number(data.shipping_fee),
        freeShippingThreshold: Number(data.free_shipping_threshold),
        codFee: Number(data.cod_fee),
        productionTime: data.production_time?.trim() || SHIPPING_DEFAULTS.productionTime,
        shippingTime: data.shipping_time?.trim() || SHIPPING_DEFAULTS.shippingTime,
        orderCutoffNote: data.order_cutoff_note?.trim() || SHIPPING_DEFAULTS.orderCutoffNote,
      };
    } catch {
      return SHIPPING_DEFAULTS;
    }
  },
  ["shipping-settings"],
  { tags: ["shipping"] }
);
