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
    affinity: number;
  }
> = {
  baiqi: {
    label: "백기",
    subtitle: "Baiqi Phone Archive",
    affinity: 51,
  },
  lizeyan: {
    label: "이택언",
    subtitle: "Lizeyan Phone Archive",
    affinity: 43,
  },
  zhouqiluo: {
    label: "주기락",
    subtitle: "Zhou Qiluo Phone Archive",
    affinity: 41,
  },
  xumo: {
    label: "허묵",
    subtitle: "Xumo Phone Archive",
    affinity: 40,
  },
  lingxiao: {
    label: "연시호",
    subtitle: "Lingxiao Phone Archive",
    affinity: 17,
  },
};

export default async function CharacterPhonePage({ params }: PageProps) {
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

  const messageCount = ownItems.filter(
    (item) => item.subtype === "message"
  ).length;

  const momentCount = ownItems.filter(
    (item) => item.subtype === "moment"
  ).length;

  const callCount = ownItems.filter(
    (item) => item.subtype === "call" || item.subtype === "video_call"
  ).length;

  const articleCount = ownItems.filter(
    (item) => item.subtype === "article"
  ).length;

  const totalCount = ownItems.length;

  return (
    <main>
      <header className="page-header">
        <div className="page-eyebrow">Character / Phone</div>
        <h1 className="page-title">{meta.label} 휴대폰</h1>
        <p className="page-desc">
          {meta.label} 관련 메시지, 모멘트, 전화 기록을 캐릭터 기준으로 모아봅니다.
        </p>
      </header>

      <section
        className="detail-panel"
        style={{ marginBottom: "24px" }}
      >
        <div className="page-eyebrow" style={{ marginBottom: "8px" }}>
          {meta.subtitle}
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: "28px",
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
          호감도 {meta.affinity} · 휴대폰 기록 {totalCount}
        </p>

        <div className="meta-row">
          <span className="meta-pill">messages: {messageCount}</span>
          <span className="meta-pill">moments: {momentCount}</span>
          <span className="meta-pill">calls: {callCount}</span>
          <span className="meta-pill">articles: {articleCount}</span>
        </div>
      </section>

      <section className="quick-grid">
        <Link
          href={`/phone-items/messages/${characterKey}/history`}
          className="quick-card"
        >
          <span className="quick-card-label">Message</span>
          <h2 className="quick-card-title">메시지</h2>
          <p className="quick-card-text">
            문자 기록 목록으로 이동합니다. 현재 {messageCount}개
          </p>
        </Link>

        <Link
          href={`/phone-items/moments/${characterKey}`}
          className="quick-card"
        >
          <span className="quick-card-label">Moment</span>
          <h2 className="quick-card-title">모멘트</h2>
          <p className="quick-card-text">
            캐릭터별 모멘트 피드로 이동합니다. 현재 {momentCount}개
          </p>
        </Link>

        <Link
          href={`/phone-items/calls/${characterKey}`}
          className="quick-card"
        >
          <span className="quick-card-label">Call</span>
          <h2 className="quick-card-title">전화</h2>
          <p className="quick-card-text">
            전화·영상통화 목록으로 이동합니다. 현재 {callCount}개
          </p>
        </Link>
      </section>

      <section
        className="detail-panel"
        style={{ marginTop: "24px" }}
      >
        <h3 className="detail-section-title">빠른 이동</h3>

        <div className="link-list">
          <Link href={`/characters/${characterKey}`} className="link-card">
            캐릭터 허브로 돌아가기
          </Link>

          <Link href={`/characters/${characterKey}/cards`} className="link-card">
            카드 보기
          </Link>

          <Link href={`/characters/${characterKey}/stories`} className="link-card">
            스토리 보기
          </Link>

          {articleCount > 0 ? (
            <div className="link-card">
              기사 기록은 나중에 연결해도 됨 · 현재 {articleCount}개
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}