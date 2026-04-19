import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getMakerActor } from "@/lib/maker/auth";
import {
  MAKER_DEFAULT_MY_AVATAR,
  MAKER_DEFAULT_MY_NAME,
  MAKER_GUEST_ID_COOKIE,
  MAKER_GUEST_NAME_COOKIE,
} from "@/lib/maker/defaults";

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

export async function getMakerViewerProfile() {
  const actor = await getMakerActor();
  const cookieStore = await cookies();

  const guestId =
    cookieStore.get(MAKER_GUEST_ID_COOKIE)?.value?.trim() || "";

  const ownerId = actor.ownerId || guestId || "";
  const displayName =
    cookieStore.get(MAKER_GUEST_NAME_COOKIE)?.value?.trim() ||
    MAKER_DEFAULT_MY_NAME;

  if (!ownerId) {
    return {
      displayName,
      avatarUrl: MAKER_DEFAULT_MY_AVATAR,
      baseProfileOptions: [] as BaseProfileRow[],
      customProfileOptions: [] as CustomProfileRow[],
      selectedSourceType: null as "option" | "custom" | null,
      selectedSourceId: null as string | null,
    };
  }

  const [{ data: baseRows }, { data: customRows }, { data: selectedRow }] =
    await Promise.all([
      supabase
        .from("phone_profile_options")
        .select("id, image_url")
        .eq("is_active", true),
      supabaseAdmin
        .from("phone_profile_custom")
        .select("id, image_url")
        .eq("owner_type", "guest")
        .eq("owner_id", ownerId)
        .eq("is_active", true),
      supabaseAdmin
        .from("phone_profile_selected")
        .select("source_type, source_id")
        .eq("owner_type", "guest")
        .eq("owner_id", ownerId)
        .maybeSingle(),
    ]);

  const baseProfileOptions = (baseRows ?? []) as BaseProfileRow[];
  const customProfileOptions = (customRows ?? []) as CustomProfileRow[];
  const selected = (selectedRow ?? null) as SelectedRow | null;

  let avatarUrl = MAKER_DEFAULT_MY_AVATAR;

  if (selected?.source_type === "option") {
    const selectedOption = baseProfileOptions.find(
      (item) => item.id === selected.source_id
    );
    if (selectedOption?.image_url) {
      avatarUrl = selectedOption.image_url;
    }
  } else if (selected?.source_type === "custom") {
    const selectedCustom = customProfileOptions.find(
      (item) => item.id === selected.source_id
    );
    if (selectedCustom?.image_url) {
      avatarUrl = selectedCustom.image_url;
    }
  }

  return {
    displayName,
    avatarUrl,
    baseProfileOptions,
    customProfileOptions,
    selectedSourceType: selected?.source_type ?? null,
    selectedSourceId: selected?.source_id ?? null,
  };
}