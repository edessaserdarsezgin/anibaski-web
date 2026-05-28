import { redirect } from "next/navigation";

export const metadata = { title: "KVKK Aydınlatma Metni" };

export default function KvkkPage() {
  redirect("/politikalar/gizlilik");
}
