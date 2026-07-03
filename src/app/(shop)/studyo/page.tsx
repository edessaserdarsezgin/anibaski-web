import { createClient } from "@/lib/supabase/server";
import StudyoClient from "./StudyoClient";

import { pageMetadata } from "@/lib/seo";

export function generateMetadata() {
  return pageMetadata("/studyo");
}

export default async function StudyoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <StudyoClient isLoggedIn={!!user} />;
}
