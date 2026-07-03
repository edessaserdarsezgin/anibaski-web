import { redirect } from "next/navigation";

import { pageMetadata } from "@/lib/seo";

export function generateMetadata() {
  return pageMetadata("/kvkk");
}

export default function KvkkPage() {
  redirect("/politikalar/gizlilik");
}
