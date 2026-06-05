import { createClient } from "@/lib/supabase/server";
import StudyoClient from "./StudyoClient";

export const metadata = { title: "AI Stüdyo | AnıBaskı" };

export default async function StudyoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <StudyoClient isLoggedIn={!!user} />;
}
