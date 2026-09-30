import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ characterKey: string }>;
};

const CHARACTER_META: Record<
  string,
  {
    label: string;
    subtitle: string;
    avatarUrl: string;
    intro: string;
  }
> = {
  baiqi: {
    label: "백기",
    subtitle: "Phone Profile",
    avatarUrl: "/images/characters/baiqi.png",
    intro: "모멘트, 문자 기록, 통화 기록으로 이동합니다.",
  },
  lizeyan: {
    label: "이택언",
    subtitle: "Phone Profile",
    avatarUrl: "/images/characters/lizeyan.png",
    intro: "모멘트, 문자 기록, 통화 기록으로 이동합니다.",
  },
  zhouqiluo: {
    label: "주기락",
    subtitle: "Phone Profile",
    avatarUrl: "/images/characters/zhouqiluo.png",
    intro: "모멘트, 문자 기록, 통화 기록으로 이동합니다.",
  },
  xumo: {
    label: "허묵",
    subtitle: "Phone Profile",
    avatarUrl: "/images/characters/xumo.png",
    intro: "모멘트, 문자 기록, 통화 기록으로 이동합니다.",
  },
  lingxiao: {
    label: "연시호",
    subtitle: "Phone Profile",
    avatarUrl: "/images/characters/lingxiao.png",
    intro: "모멘트, 문자 기록, 통화 기록으로 이동합니다.",
  },
};

export default async function CharacterProfilePage({ params }: PageProps) {
  const { characterKey } = await params;
  const meta = CHARACTER_META[characterKey];

  if (!meta) notFound();

  const { data: phoneItems, error } = await supabase
    .from("phone_items")
    .select("id, subtype, is_published, content_json")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const ownItems =
    phoneItems?.filter(
      (item) => item.content_json?.characterKey === characterKey
    ) ?? [];

  const momentCount = ownItems.filter((item) => item.subtype === "moment").length;
  const messageCount = ownItems.filter((item) => item.subtype === "message").length;
  const callCount = ownItems.filter(
    (item) => item.subtype === "call" || item.subtype === "video_call"
  ).length;
  const articleCount = ownItems.filter((item) => item.subtype === "article").length;

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Character / Profile</div>
        <h1 className="page-title">{meta.label} 개인상세</h1>
        <p className="page-desc">
          {meta.label} 관련 휴대폰 콘텐츠 진입 허브입니다.
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
            {meta.intro}
          </p>

          <div className="meta-row">
            <span className="meta-pill">moments: {momentCount}</span>
            <span className="meta-pill">messages: {messageCount}</span>
            <span className="meta-pill">calls: {callCount}</span>
            <span className="meta-pill">articles: {articleCount}</span>
          </div>
        </div>
      </section>

      <section className="quick-grid">
        <Link
          href={`/phone-items/moments/${characterKey}`}
          className="quick-card"
        >
          <span className="quick-card-label">Moment</span>
          <h2 className="quick-card-title">모멘트</h2>
          <p className="quick-card-text">
            기본 피드에서 보고, 상단에서 모아보기로 전환합니다.
          </p>
        </Link>

        <Link
          href={`/phone-items/messages/${characterKey}/history`}
          className="quick-card"
        >
          <span className="quick-card-label">Message</span>
          <h2 className="quick-card-title">문자 목록</h2>
          <p className="quick-card-text">
            역사채팅 목록과 카테고리별 메시지 기록으로 이동합니다.
          </p>
        </Link>

        <Link
          href={`/phone-items/calls/${characterKey}`}
          className="quick-card"
        >
          <span className="quick-card-label">Call</span>
          <h2 className="quick-card-title">통화 목록</h2>
          <p className="quick-card-text">
            전화·영상통화 기록 목록으로 이동합니다.
          </p>
        </Link>
      </section>

      <section className="detail-panel" style={{ marginTop: "24px" }}>
        <h3 className="detail-section-title">빠른 이동</h3>

        <div className="link-list">
          <Link href={`/characters/${characterKey}`} className="link-card">
            캐릭터 허브
          </Link>

          <Link href={`/characters/${characterKey}/cards`} className="link-card">
            카드
          </Link>

          <Link href={`/characters/${characterKey}/stories`} className="link-card">
            스토리
          </Link>

          <Link href={`/characters/${characterKey}/phone`} className="link-card">
            휴대폰
          </Link>
        </div>
      </section>
    </main>
  );
}