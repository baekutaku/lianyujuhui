import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase/server";
import PhoneMeScreen from "@/components/phone/PhoneMeScreen";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneShell from "@/components/phone/PhoneShell";
import { getPhoneProfileActor } from "@/lib/phone/get-phone-profile-actor";
import { redirect } from "next/navigation";
import { getMomentCountByAuthorKey } from "@/lib/phone/moment-author";
import { supabaseAdmin } from "@/lib/supabase/admin";

type BaseProfileRow = {
  id: string;
  title: string | null;
  image_url: string;
  sort_order: number;
};

type CustomProfileRow = {
  id: string;
  title: string | null;
  image_url: string;
};

const CHARACTERS = [
  { key: "baiqi", label: "백기", avatarUrl: "/profile/baiqi.png", affinity: 51 },
  { key: "lizeyan", label: "이택언", avatarUrl: "/profile/lizeyan.png", affinity: 43 },
  { key: "zhouqiluo", label: "주기락", avatarUrl: "/profile/zhouqiluo.png", affinity: 41 },
  { key: "xumo", label: "허묵", avatarUrl: "/profile/xumo.png", affinity: 40 },
  { key: "lingxiao", label: "연시호", avatarUrl: "/profile/lingxiao.png", affinity: 17 },
] as const;

export default async function PhoneMePage() {
  const actor = await getPhoneProfileActor();

  if (actor.needsGuestCookie) {
    redirect("/phone-items/me/init?redirectTo=/phone-items/me");
  }

  const cookieStore = await cookies();
  const guestId = cookieStore.get("phone_guest_id")?.value?.trim();

  const ownerType = actor.ownerType;
  const ownerId = actor.ownerId || guestId || "";
  const profileDb = ownerType === "guest" ? supabaseAdmin : supabase;

  const [
    { data: baseProfiles, error: baseError },
    { data: customProfiles, error: customError },
    { data: selectedRow, error: selectedError },
    myMomentCount,
    totalMomentCount,
    ...characterMomentCounts
  ] = await Promise.all([
    supabase
      .from("phone_profile_options")
      .select("id, title, image_url, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),

    ownerId
      ? profileDb
          .from("phone_profile_custom")
          .select("id, title, image_url")
          .eq("owner_type", ownerType)
          .eq("owner_id", ownerId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null } as any),

    ownerId
      ? profileDb
          .from("phone_profile_selected")
          .select("source_type, source_id")
          .eq("owner_type", ownerType)
          .eq("owner_id", ownerId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as any),

    getMomentCountByAuthorKey("mc"),

    supabase
      .from("phone_items")
      .select("*", { count: "exact", head: true })
      .eq("subtype", "moment")
      .eq("is_published", true)
      .then((res) => res.count ?? 0),

    ...CHARACTERS.map((character) => getMomentCountByAuthorKey(character.key)),
  ]);

  if (baseError) throw new Error(baseError.message);
  if (customError) throw new Error(customError.message);
  if (selectedError) throw new Error(selectedError.message);

  const characters = CHARACTERS.map((character, index) => ({
    ...character,
    moments: Number(characterMomentCounts[index] ?? 0),
  }));

  const baseProfileOptions =
    ((baseProfiles as BaseProfileRow[] | null) ?? []).map((item) => ({
      id: item.id,
      title: item.title ?? "",
      imageUrl: item.image_url,
      sourceType: "option" as const,
      sortOrder: item.sort_order,
    })) ?? [];

  const customProfileOptions =
    ((customProfiles as CustomProfileRow[] | null) ?? []).map((item) => ({
      id: item.id,
      title: item.title ?? "",
      imageUrl: item.image_url,
      sourceType: "custom" as const,
    })) ?? [];

  const guestName = cookieStore.get("phone_guest_name")?.value?.trim() || "유연";

  let avatarUrl = "/profile/mc.png";

  if (selectedRow?.source_type === "option") {
    const selectedOption = baseProfileOptions.find(
      (item) => item.id === selectedRow.source_id
    );
    if (selectedOption?.imageUrl) {
      avatarUrl = selectedOption.imageUrl;
    }
  } else if (selectedRow?.source_type === "custom") {
    const selectedCustom = customProfileOptions.find(
      (item) => item.id === selectedRow.source_id
    );
    if (selectedCustom?.imageUrl) {
      avatarUrl = selectedCustom.imageUrl;
    }
  }

  const viewerProfile = {
    displayName: guestName,
    avatarUrl,
  };

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar title="나" subtitle="개인 정보" />

        <div className="phone-content">
          <PhoneMeScreen
            viewerName={viewerProfile.displayName}
            defaultAvatarUrl={viewerProfile.avatarUrl}
            characters={characters}
            baseProfileOptions={baseProfileOptions}
            customProfileOptions={customProfileOptions}
            myMomentCount={myMomentCount}
            totalMomentCount={totalMomentCount ?? 0}
            initialSelectedSourceType={selectedRow?.source_type ?? null}
            initialSelectedSourceId={selectedRow?.source_id ?? null}
            isAdmin={actor.isAdmin}
          />
        </div>

        <PhoneTabNav currentPath="/phone-items/me" />
      </PhoneShell>
    </main>
  );
}