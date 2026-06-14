"use client";

const KEY = "anibaski:recent";
const MAX = 10;

export type RecentItem = { slug: string; name: string; image: string | null; price: number };

export function pushRecentlyViewed(item: RecentItem) {
  try {
    const raw = localStorage.getItem(KEY);
    const list: RecentItem[] = raw ? JSON.parse(raw) : [];
    const next = [item, ...list.filter((x) => x.slug !== item.slug)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* gizli mod / kota — sessizce yok say */
  }
}

export function readRecentlyViewed(): RecentItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
}
