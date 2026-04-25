import Link from "next/link";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase/server";
import PhoneMeScreen from "@/components/phone/PhoneMeScreen";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import PhoneProfileShell from "@/components/phone/PhoneProfileShell";
import { getPhoneProfileActor } from "@/lib/phone/get-phone-profile-actor";
import { redirect } from "next/navigation";
import { getMomentCountByAuthorKey } from "@/lib/phone/moment-author";
import { supabaseAdmin } from "@/lib/supabase/admin";

type BaseProfileRow = {
  id: string;
  title: string | null;
  image_url: string;
  sort_order: number;
  is_shared_custom: boolean;
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
    { data: allProfileOptions, error: baseError },
    { data: customProfiles, error: customError },
    { data: selectedRow, error: selectedError },
    myMomentCount,
    totalMomentCount,
    ...characterMomentCounts
  ] = await Promise.all([
    // is_shared_custom 포함해서 전체 기본 옵션 조회
    supabase
      .from("phone_profile_options")
      .select("id, title, image_url, sort_order, is_shared_custom")
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

  const rows = (allProfileOptions as BaseProfileRow[] | null) ?? [];

  // is_shared_custom=false → 기본 프로필 (기존 역할)
  const baseProfileOptions = rows
    .filter((item) => !item.is_shared_custom)
    .map((item) => ({
      id: item.id,
      title: item.title ?? "",
      imageUrl: item.image_url,
      sourceType: "option" as const,
      sortOrder: item.sort_order,
    }));

  // is_shared_custom=true → 관리자 공유 커스텀 풀
  const sharedCustomPool = rows
    .filter((item) => item.is_shared_custom)
    .map((item) => ({
      id: item.id,
      title: item.title ?? "",
      imageUrl: item.image_url,
      sortOrder: item.sort_order,
    }));

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
      <PhoneProfileShell tabbar={<PhoneTabNav currentPath="/phone-items/me" />}>
        <div className="phone-me-page phone-me-root">
          <Link
            href="/phone-items"
            className="phone-me-back-button phone-me-back-button-inside"
            aria-label="뒤로가기"
            title="뒤로가기"
          >
            뒤로가기
          </Link>

          <PhoneMeScreen
            viewerName={viewerProfile.displayName}
            defaultAvatarUrl={viewerProfile.avatarUrl}
            characters={characters}
            baseProfileOptions={baseProfileOptions}
            customProfileOptions={customProfileOptions}
            sharedCustomPool={sharedCustomPool}
            myMomentCount={myMomentCount}
            totalMomentCount={totalMomentCount ?? 0}
            initialSelectedSourceType={selectedRow?.source_type ?? null}
            initialSelectedSourceId={selectedRow?.source_id ?? null}
            isAdmin={actor.isAdmin}
          />
        </div>
      </PhoneProfileShell>
    </main>
  );
}