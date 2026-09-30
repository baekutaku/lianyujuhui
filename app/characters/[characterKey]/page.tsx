import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    characterKey: string;
  }>;
};

const CHARACTER_META: Record<
  string,
  {
    label: string;
    subtitle: string;
    affinity: number;
    avatarUrl: string;
  }
> = {
  baiqi: {
    label: "백기",
    subtitle: "Baiqi Archive",
    affinity: 51,
    avatarUrl: "/images/characters/baiqi.png",
  },
  lizeyan: {
    label: "이택언",
    subtitle: "Lizeyan Archive",
    affinity: 43,
    avatarUrl: "/images/characters/lizeyan.png",
  },
  zhouqiluo: {
    label: "주기락",
    subtitle: "Zhou Qiluo Archive",
    affinity: 41,
    avatarUrl: "/images/characters/zhouqiluo.png",
  },
  xumo: {
    label: "허묵",
    subtitle: "Xumo Archive",
    affinity: 40,
    avatarUrl: "/images/characters/xumo.png",
  },
  lingxiao: {
    label: "연시호",
    subtitle: "Lingxiao Archive",
    affinity: 17,
    avatarUrl: "/images/characters/lingxiao.png",
  },
};

export default async function CharacterHubPage({ params }: PageProps) {
  const { characterKey } = await params;
  const meta = CHARACTER_META[characterKey];

  if (!meta) notFound();

  const { data: character } = await supabase
    .from("characters")
    .select("id, key, name_ko, name_zh")
    .eq("key", characterKey)
    .maybeSingle();

  if (!character) notFound();

  const [{ count: cardsCount }, { count: storiesCount }, { data: phoneItems }] =
    await Promise.all([
      supabase
        .from("cards")
        .select("id", { count: "exact", head: true })
        .eq("primary_character_id", character.id)
        .eq("is_published", true),

      supabase
        .from("stories")
        .select("id", { count: "exact", head: true })
        .eq("primary_character_id", character.id)
        .eq("is_published", true),

      supabase
        .from("phone_items")
        .select("id, subtype, is_published, content_json")
        .eq("is_published", true),
    ]);

  const ownPhoneItems =
    phoneItems?.filter(
      (item) => item.content_json?.characterKey === characterKey
    ) ?? [];

  const messageCount = ownPhoneItems.filter(
    (item) => item.subtype === "message"
  ).length;

  const momentCount = ownPhoneItems.filter(
    (item) => item.subtype === "moment"
  ).length;

  const callCount = ownPhoneItems.filter(
    (item) => item.subtype === "call" || item.subtype === "video_call"
  ).length;

  const phoneTotal = messageCount + momentCount + callCount;

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Character Hub</div>
        <h1 className="page-title">{meta.label}</h1>
        <p className="page-desc">
          카드, 스토리, 휴대폰 콘텐츠를 캐릭터 기준으로 모아보는 허브입니다.
        </p>
      </header>

      <section
        className="detail-panel"
        style={{
          display: "grid",
          gridTemplateColumns: "120px 1fr",
          gap: "24px",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <img
            src={meta.avatarUrl}
            alt={meta.label}
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "24px",
              objectFit: "cover",
              border: "1px solid rgba(167, 194, 215, 0.35)",
              background: "rgba(255,255,255,0.7)",
            }}
          />
        </div>

        <div>
          <div className="page-eyebrow" style={{ marginBottom: "8px" }}>
            {meta.subtitle}
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: "30px",
              lineHeight: 1.2,
              fontWeight: 800,
            }}
          >
            {meta.label}
          </h2>
          <p
            style={{
              marginTop: "10px",
              marginBottom: "14px",
              color: "var(--text-sub)",
              lineHeight: 1.7,
            }}
          >
            호감도 {meta.affinity} · 카드 {cardsCount ?? 0} · 스토리{" "}
            {storiesCount ?? 0} · 휴대폰 {phoneTotal}
          </p>

          <div className="meta-row">
            <span className="meta-pill">messages: {messageCount}</span>
            <span className="meta-pill">moments: {momentCount}</span>
            <span className="meta-pill">calls: {callCount}</span>
          </div>
        </div>
      </section>

      <section className="quick-grid">
        <Link href={`/characters/${characterKey}/cards`} className="quick-card">
          <span className="quick-card-label">Cards</span>
          <h2 className="quick-card-title">카드</h2>
          <p className="quick-card-text">
            등급, 속성, 연결 스토리 기준으로 {meta.label} 카드를 정리합니다.
          </p>
        </Link>

        <Link
          href={`/characters/${characterKey}/stories`}
          className="quick-card"
        >
          <span className="quick-card-label">Stories</span>
          <h2 className="quick-card-title">스토리</h2>
          <p className="quick-card-text">
            메인스토리, 마이홈, 서월국, 비밀이야기, 데이트, 회사 프로젝트 등을
            유형별로 정리합니다.
          </p>
        </Link>

        <Link href={`/characters/${characterKey}/phone`} className="quick-card">
          <span className="quick-card-label">Phone</span>
          <h2 className="quick-card-title">휴대폰</h2>
          <p className="quick-card-text">
            메시지, 모멘트, 전화 콘텐츠를 {meta.label} 기준으로 모아봅니다.
          </p>
        </Link>
      </section>

      <section
        className="detail-panel"
        style={{ marginTop: "24px" }}
      >
        <h3 className="detail-section-title">빠른 이동</h3>

        <div className="link-list">
          <Link
            href={`/phone-items/messages/${characterKey}/history`}
            className="link-card"
          >
            문자 기록 보기 ({messageCount})
          </Link>

          <Link
            href={`/phone-items/moments/${characterKey}`}
            className="link-card"
          >
            모멘트 보기 ({momentCount})
          </Link>

          <Link
            href={`/phone-items/calls/${characterKey}`}
            className="link-card"
          >
            통화 기록 보기 ({callCount})
          </Link>
        </div>
      </section>
    </main>
  );
}