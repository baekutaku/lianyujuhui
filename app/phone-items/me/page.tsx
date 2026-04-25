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

type ProfileOptionRow = {
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
  { key: "baiqi",     label: "백기",   avatarUrl: "/profile/baiqi.png",     affinity: 51 },
  { key: "lizeyan",   label: "이택언", avatarUrl: "/profile/lizeyan.png",   affinity: 43 },
  { key: "zhouqiluo", label: "주기락", avatarUrl: "/profile/zhouqiluo.png", affinity: 41 },
  { key: "xumo",      label: "허묵",   avatarUrl: "/profile/xumo.png",      affinity: 40 },
  { key: "lingxiao",  label: "연시호", avatarUrl: "/profile/lingxiao.png",  affinity: 17 },
] as const;

const DEFAULT_AVATAR = "/profile/mc.png";

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
    { data: allOptions, error: optionsError },
    { data: customProfiles, error: customError },
    { data: selectedRow, error: selectedError },
    myMomentCount,
    totalMomentCount,
    ...characterMomentCounts
  ] = await Promise.all([
    // is_shared_custom 포함 전체 옵션 조회
    supabase
      .from("phone_profile_options")
      .select("id, title, image_url, sort_order, is_shared_custom")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),

    // 내 커스텀 프로필
    ownerId
      ? profileDb
          .from("phone_profile_custom")
          .select("id, title, image_url")
          .eq("owner_type", ownerType)
          .eq("owner_id", ownerId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null } as any),

    // 현재 선택된 프로필
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

    ...CHARACTERS.map((c) => getMomentCountByAuthorKey(c.key)),
  ]);

  if (optionsError) throw new Error(optionsError.message);
  if (customError)  throw new Error(customError.message);
  if (selectedError) throw new Error(selectedError.message);

  const rows = (allOptions as ProfileOptionRow[] | null) ?? [];

  // is_shared_custom=false → 기본 프로필
  const baseProfileOptions = rows
    .filter((r) => !r.is_shared_custom)
    .map((r) => ({
      id: r.id,
      title: r.title ?? "",
      imageUrl: r.image_url,
      sourceType: "option" as const,
      sortOrder: r.sort_order,
    }));

  // is_shared_custom=true → 관리자 공유 커스텀 풀
  const sharedCustomPool = rows
    .filter((r) => r.is_shared_custom)
    .map((r) => ({
      id: r.id,
      title: r.title ?? "",
      imageUrl: r.image_url,
      sortOrder: r.sort_order,
    }));

  // 내 커스텀
  const customProfileOptions = ((customProfiles as CustomProfileRow[] | null) ?? []).map(
    (r) => ({
      id: r.id,
      title: r.title ?? "",
      imageUrl: r.image_url,
      sourceType: "custom" as const,
    })
  );

  const characters = CHARACTERS.map((c, i) => ({
    ...c,
    moments: Number(characterMomentCounts[i] ?? 0),
  }));

  const guestName = cookieStore.get("phone_guest_name")?.value?.trim() || "유연";

  // 현재 아바타 결정
  let avatarUrl = DEFAULT_AVATAR;
  if (selectedRow?.source_type === "option") {
    const found = baseProfileOptions.find((o) => o.id === selectedRow.source_id);
    if (found?.imageUrl) avatarUrl = found.imageUrl;
  } else if (selectedRow?.source_type === "custom") {
    const found = customProfileOptions.find((o) => o.id === selectedRow.source_id);
    if (found?.imageUrl) avatarUrl = found.imageUrl;
  }

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
            viewerName={guestName}
            defaultAvatarUrl={avatarUrl}
            baseDefaultAvatarUrl={DEFAULT_AVATAR}
            baseProfileOptions={baseProfileOptions}
            customProfileOptions={customProfileOptions}
            sharedCustomPool={sharedCustomPool}
            characters={characters}
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