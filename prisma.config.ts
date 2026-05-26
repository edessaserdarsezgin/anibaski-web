import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// .env.local'ı yükle (Next.js env dosyası)
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
  },
});
