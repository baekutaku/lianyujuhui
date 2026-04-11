import { supabase } from "@/lib/supabase/server";

export type PhoneProfile = {
  key: string;
  displayName: string;
  avatarUrl: string;
};

export async function getMcProfile(): Promise<PhoneProfile> {
  const { data } = await supabase
    .from("phone_profiles")
    .select("key, display_name, avatar_url")
    .eq("key", "mc")
    .maybeSingle();

  return {
    key: "mc",
    displayName: data?.display_name?.trim() || "유연",
    avatarUrl: data?.avatar_url?.trim() || "/profile/mc.png",
  };
}