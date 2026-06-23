import { redirect } from "next/navigation";

export const metadata = { title: "KVKK Aydınlatma Metni", alternates: { canonical: "/kvkk" } };

export default function KvkkPage() {
  redirect("/politikalar/gizlilik");
}
