import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPhoneProfileActor } from "@/lib/phone/get-phone-profile-actor";

type SelectedRow = {
  source_type: "option" | "custom" | null;
  source_id: string | null;
};

type BaseProfileRow = {
  id: string;
  image_url: string;
};

type CustomProfileRow = {
  id: string;
  image_url: string;
};

export async function getCurrentViewerProfile() {
  const actor = await getPhoneProfileActor();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("phone_guest_id")?.value?.trim() || "";

  const ownerType = actor.ownerType;
  const ownerId = actor.ownerId || guestId || "";
  const profileDb = ownerType === "guest" ? supabaseAdmin : supabase;

  const guestName =
    cookieStore.get("phone_guest_name")?.value?.trim() || "유연";

  if (!ownerId) {
    return {
      displayName: guestName,
      avatarUrl: "/profile/mc.png",
    };
  }

  const [
    { data: baseProfiles },
    { data: customProfiles },
    { data: selectedRow },
  ] = await Promise.all([
    supabase
      .from("phone_profile_options")
      .select("id, image_url")
      .eq("is_active", true),
    profileDb
      .from("phone_profile_custom")
      .select("id, image_url")
      .eq("owner_type", ownerType)
      .eq("owner_id", ownerId)
      .eq("is_active", true),
  profileDb
  .from("phone_profile_selected")
  .select("source_type, source_id")
  .eq("owner_type", ownerType)
  .eq("owner_id", ownerId)
  .limit(1)
  .maybeSingle(),
  ]);

  const baseRows = (baseProfiles ?? []) as BaseProfileRow[];
  const customRows = (customProfiles ?? []) as CustomProfileRow[];
  const selected = (selectedRow ?? null) as SelectedRow | null;

  let avatarUrl = "/profile/mc.png";

  if (selected?.source_type === "option") {
    const selectedOption = baseRows.find((item) => item.id === selected.source_id);
    if (selectedOption?.image_url) {
      avatarUrl = selectedOption.image_url;
    }
  } else if (selected?.source_type === "custom") {
    const selectedCustom = customRows.find((item) => item.id === selected.source_id);
    if (selectedCustom?.image_url) {
      avatarUrl = selectedCustom.image_url;
    }
  }

  return {
    displayName: guestName,
    avatarUrl,
  };
}