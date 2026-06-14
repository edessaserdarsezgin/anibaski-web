"use client";

import { useEffect } from "react";
import { pushRecentlyViewed, type RecentItem } from "@/hooks/useRecentlyViewed";

export default function TrackRecentlyViewed({ item }: { item: RecentItem }) {
  useEffect(() => {
    pushRecentlyViewed(item);
  }, [item.slug]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
