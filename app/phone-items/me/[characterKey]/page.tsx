import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import PhoneProfileShell from "@/components/phone/PhoneProfileShell";
import { getMomentCountByAuthorKey } from "@/lib/phone/moment-author";

type PageProps = {
  params: Promise<{
    characterKey: string;
  }>;
};

type PhoneItemRow = {
  id: string;
  subtype: string;
  content_json?: {
    characterKey?: string;
  } | null;
};

const CHARACTER_META: Record<
  string,
  {
    label: string;
    title: string;
    avatarUrl: string;
    intro: string;
    affinity: number;
    affinityNow: number;
    affinityMax: number;
  }
> = {
  baiqi: {
    label: "백기",
    title: "개인 정보",
    avatarUrl: "/profile/baiqi.png",
    intro: "선배는 그다지 차갑지 않다",
    affinity: 51,
    affinityNow: 796,
    affinityMax: 14200,
  },
  lizeyan: {
    label: "이택언",
    title: "개인 정보",
    avatarUrl: "/profile/lizeyan.png",
    intro: "불필요한 웃음은 없지만, 의외로 다정하다",
    affinity: 43,
    affinityNow: 5822,
    affinityMax: 9500,
  },
  zhouqiluo: {
    label: "주기락",
    title: "개인 정보",
    avatarUrl: "/profile/zhouqiluo.png",
    intro: "그의 빛은 눈부시고도 부드럽다",
    affinity: 41,
    affinityNow: 1172,
    affinityMax: 8500,
  },
  xumo: {
    label: "허묵",
    title: "개인 정보",
    avatarUrl: "/profile/xumo.png",
    intro: "신비로운 천재 과학자",
    affinity: 40,
    affinityNow: 7848,
    affinityMax: 8000,
  },
  lingxiao: {
    label: "연시호",
    title: "개인 정보",
    avatarUrl: "/profile/lingxiao.png",
    intro: "조금은 수상한, 그래도 눈에 밟히는 남자",
    affinity: 17,
    affinityNow: 456,
    affinityMax: 1300,
  },
};

export default async function PhoneMeCharacterPage({ params }: PageProps) {
  const { characterKey } = await params;
  const meta = CHARACTER_META[characterKey];

  if (!meta) notFound();

  const { data, error } = await supabase
    .from("phone_items")
    .select("id, subtype, content_json")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const items =
    ((data as PhoneItemRow[] | null) ?? []).filter(
      (item) => item.content_json?.characterKey === characterKey
    ) ?? [];

  const messageCount = items.filter((item) => item.subtype === "message").length;

  const callCount = items.filter(
    (item) => item.subtype === "call" || item.subtype === "video_call"
  ).length;

  const articleCount = items.filter((item) => item.subtype === "article").length;

  const momentCount = await getMomentCountByAuthorKey(characterKey);

  const totalCollected = momentCount + messageCount + callCount + articleCount;

  const progressPercent =
    meta.affinityMax > 0
      ? Math.min((meta.affinityNow / meta.affinityMax) * 100, 100)
      : 0;

  return (
  <main className="phone-page">
    <PhoneProfileShell tabbar={<PhoneTabNav currentPath="/phone-items/me" />}>
      <div className="phone-me-character-page phone-character-detail-screen">
        <Link
          href="/phone-items/me"
          className="phone-me-back-button phone-me-back-button-inside"
          aria-label="뒤로가기"
          title="뒤로가기"
        >
          뒤로가기
        </Link>

        <section className="phone-character-hero">
          <div
            className="phone-character-hero-art"
            style={{ backgroundImage: `url(${meta.avatarUrl})` }}
          />

          <div className="phone-personal-title">개인 상세</div>

          <div className="phone-character-profile-row">
            <img
              src={meta.avatarUrl}
              alt={meta.label}
              className="phone-character-avatar"
            />

            <div className="phone-character-profile-main">
              <div className="phone-character-name-row">
                <strong className="phone-character-name">{meta.label}</strong>
                <span className="material-symbols-rounded phone-character-edit">
                  edit
                </span>
              </div>

              <div className="phone-character-exp">
                {meta.affinityNow}/{meta.affinityMax}
              </div>

              <div className="phone-character-progress">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="phone-character-level">
              {meta.affinity}
            </div>
          </div>

          <section className="phone-character-info-card">
            <div className="phone-character-info-label">개인 자료</div>
            <p>{meta.intro}</p>
            <span className="phone-character-detail-watermark">DETAIL</span>
          </section>
        </section>

        <nav className="phone-personal-menu phone-character-menu">
          <Link
            href={`/phone-items/moments/${characterKey}`}
            className="phone-menu-row"
          >
            <span className="phone-menu-left">
              <span className="material-symbols-rounded phone-menu-icon">
                local_florist
              </span>
              <span>모멘트</span>
            </span>
            <span className="phone-menu-count">{momentCount}</span>
          </Link>

          <Link
            href={`/phone-items/messages/${characterKey}/history`}
            className="phone-menu-row"
          >
            <span className="phone-menu-left">
              <span className="material-symbols-rounded phone-menu-icon">
                forum
              </span>
              <span>문자 기록</span>
            </span>
            <span className="phone-menu-count">{messageCount}</span>
          </Link>

          <Link
            href={`/phone-items/calls/${characterKey}/history`}
            className="phone-menu-row"
          >
            <span className="phone-menu-left">
              <span className="material-symbols-rounded phone-menu-icon">
                volume_up
              </span>
              <span>통화 기록</span>
            </span>
            <span className="phone-menu-count">{callCount}</span>
          </Link>

          <div className="phone-menu-row is-disabled">
            <span className="phone-menu-left">
              <span className="material-symbols-rounded phone-menu-icon">
                speaker_notes
              </span>
              <span>기록 수집</span>
            </span>
            <span className="phone-menu-count">{totalCollected}</span>
          </div>

          <div className="phone-menu-row is-disabled phone-menu-row-extra">
            <span className="phone-menu-left">
              <span className="material-symbols-rounded phone-menu-icon">
                edit
              </span>
              <span>채팅 배경 변경</span>
            </span>
            <span className="phone-menu-status">나중에</span>
          </div>

          <div className="phone-menu-row is-disabled phone-menu-row-extra">
            <span className="phone-menu-left">
              <span className="material-symbols-rounded phone-menu-icon">
                edit
              </span>
              <span>통화 배경 변경</span>
            </span>
            <span className="phone-menu-status">나중에</span>
          </div>
        </nav>
      </div>
    </PhoneProfileShell>
  </main>
);
}