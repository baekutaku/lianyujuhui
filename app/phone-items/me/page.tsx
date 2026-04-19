import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase/server";
import PhoneMeScreen from "@/components/phone/PhoneMeScreen";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import { getPhoneProfileActor } from "@/lib/phone/get-phone-profile-actor";
import { redirect } from "next/navigation";
import { getMomentCountByAuthorKey } from "@/lib/phone/moment-author";
import { supabaseAdmin } from "@/lib/supabase/admin";

type PhoneItemRow = {
  id: string;
  subtype: string;
  content_json?: {
    characterKey?: string;
  } | null;
};

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

function getMomentCount(items: PhoneItemRow[], characterKey: string) {
  return items.filter(
    (item) =>
      item.content_json?.characterKey === characterKey &&
      item.subtype === "moment"
  ).length;
}

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
    { data: phoneItems, error: phoneError },
    { data: baseProfiles, error: baseError },
    { data: customProfiles, error: customError },
    { data: selectedRow, error: selectedError },
  ] = await Promise.all([
    supabase
      .from("phone_items")
      .select("id, subtype, content_json")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),

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
  ]);

  if (phoneError) throw new Error(phoneError.message);
  if (baseError) throw new Error(baseError.message);
  if (customError) throw new Error(customError.message);
  if (selectedError) throw new Error(selectedError.message);

const items = (phoneItems as PhoneItemRow[] | null) ?? [];

const myMomentCount = await getMomentCountByAuthorKey("mc");

const { count: totalMomentCount } = await supabase
  .from("phone_items")
  .select("*", { count: "exact", head: true })
  .eq("subtype", "moment")
  .eq("is_published", true);

const characters = CHARACTERS.map((character) => ({
  ...character,
  moments: getMomentCount(items, character.key),
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
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "start center",
        padding: "24px 0 40px",
      }}
    >
     <div
  style={{
    width: "100%",
    maxWidth: 520,
    minHeight: 820,
    display: "flex",
    flexDirection: "column",
    background: "rgba(255,255,255,0.12)",
    borderRadius: 30,
    overflow: "hidden",
    border: "1px solid rgba(226, 208, 224, 0.45)",
    boxShadow: "0 10px 30px rgba(196, 177, 199, 0.08)",
  }}
      >
        <div style={{ flex: 1 }}>
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

     <div
  style={{
    marginTop: "auto",
    borderTop: "1px solid rgba(220, 210, 220, 0.5)",
    background: "rgba(255,255,255,0.18)",
    padding: "8px 10px 10px",
  }}
>
          <PhoneTabNav currentPath="/phone-items/me" />
        </div>
      </div>
    </main>
  );
}