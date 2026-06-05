import { createAdminClient } from "@/lib/supabase/server";

export type CompanyInfo = {
  name: string;
  address: string;
  email: string;
  phone: string;
  taxOffice: string;
  taxNo: string;
  mersisNo: string;
  web: string;
  tradeRegistryNo: string;
  kepAddress: string;
  supportPhone: string;
  workingHours: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  landline: string;
  contractPhone: "phone" | "landline";
};

export const COMPANY_DEFAULTS: CompanyInfo = {
  name: "AnıBaskı",
  address: "",
  email: "info@anibaski.com",
  phone: "",
  taxOffice: "",
  taxNo: "",
  mersisNo: "",
  web: "www.anibaski.com",
  tradeRegistryNo: "",
  kepAddress: "",
  supportPhone: "",
  workingHours: "",
  bankName: "",
  accountHolder: "",
  iban: "",
  landline: "",
  contractPhone: "phone",
};

export async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("company_info")
      .select("data")
      .eq("id", 1)
      .single();
    return { ...COMPANY_DEFAULTS, ...((data?.data as Partial<CompanyInfo>) ?? {}) };
  } catch {
    return COMPANY_DEFAULTS;
  }
}

/** Sözleşmelerde gösterilecek telefonu seçer (cep / sabit). */
export function sellerForContracts(info: CompanyInfo): CompanyInfo {
  const phone = info.contractPhone === "landline" && info.landline ? info.landline : info.phone;
  return { ...info, phone };
}
