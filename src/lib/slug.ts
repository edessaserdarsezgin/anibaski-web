// Türkçe karakterleri ascii'ye indirip URL slug üretir. Saf fonksiyon —
// hem client formlar hem server API'ları import eder (server bağımlılığı YOK).

export const TR_MAP: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u",
};

export function slugify(text: string): string {
  return text.split("").map((c) => TR_MAP[c] ?? c).join("")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
