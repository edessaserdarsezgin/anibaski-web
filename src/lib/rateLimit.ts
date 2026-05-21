type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

// windowMs içinde maxRequests aşılırsa true döner (rate limit aşıldı)
export function isRateLimited(key: string, maxRequests = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= maxRequests) return true;

  entry.count++;
  return false;
}
