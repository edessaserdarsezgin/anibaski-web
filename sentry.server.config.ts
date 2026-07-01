// Sunucu tarafı Sentry başlatma. DSN boşsa SDK tamamen sessiz (no-op) kalır.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Sadece hata takibi hedefleniyor — düşük trace örnekleme (maliyet/gürültü az)
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === "production",
});
