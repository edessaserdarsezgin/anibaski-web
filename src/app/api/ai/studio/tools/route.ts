import { NextResponse } from "next/server";
import { getStudioTools } from "@/lib/studioTools";

// Galeri araç listesi (public). lora/prompt sızdırılmaz — yalnız görünüm alanları.
export async function GET() {
  const tools = await getStudioTools();
  return NextResponse.json(
    tools.map((t) => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
      icon: t.icon,
      active: t.active,
      engine: t.engine,
      generative: t.generative,
    }))
  );
}
