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
        <div className="phone-me-character-page">
          <div className="phone-me-character-topbar">
            <Link
              href="/phone-items/me"
              className="phone-me-back-button"
              aria-label="뒤로가기"
              title="뒤로가기"
            >
              뒤로가기
            </Link>
          </div>

          <div
            style={{
              position: "relative",
              padding: "24px 22px 18px",
              background:
                "linear-gradient(135deg, rgba(234,214,255,0.72) 0%, rgba(255,214,229,0.72) 100%)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${meta.avatarUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.08,
              }}
            />

            <div
              style={{
                position: "relative",
                fontSize: 18,
                fontWeight: 800,
                color: "#7d6c88",
                textAlign: "right",
                marginBottom: 16,
                letterSpacing: "0.04em",
              }}
            >
              {meta.title}
            </div>

            <section
              style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "86px 1fr auto",
                gap: 16,
                alignItems: "center",
                background: "rgba(255,255,255,0.20)",
                borderRadius: 22,
                padding: 14,
                marginBottom: 14,
                backdropFilter: "blur(4px)",
              }}
            >
              <img
                src={meta.avatarUrl}
                alt={meta.label}
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: 16,
                  objectFit: "cover",
                  display: "block",
                  boxShadow: "0 6px 18px rgba(179, 150, 168, 0.18)",
                }}
              />

              <div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#5f5463",
                    marginBottom: 8,
                  }}
                >
                  {meta.label}
                </div>

                <div
                  style={{
                    fontSize: 15,
                    color: "#7a6e7a",
                    marginBottom: 10,
                  }}
                >
                  {meta.affinityNow}/{meta.affinityMax}
                </div>

                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    background: "rgba(220, 214, 226, 0.85)",
                    overflow: "hidden",
                    maxWidth: 260,
                  }}
                >
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #f39cbc, #f7b7ce)",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  justifyItems: "end",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.65)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#8a7791",
                  }}
                >
                  {meta.affinity}
                </div>
              </div>
            </section>

            <section
              style={{
                position: "relative",
                background: "rgba(255,255,255,0.18)",
                borderRadius: 20,
                padding: "16px 18px 24px",
                boxShadow: "0 6px 20px rgba(227, 215, 224, 0.22)",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#8aa2e6",
                  marginBottom: 12,
                }}
              >
                개인 자료
              </div>

              <div
                style={{
                  fontSize: 18,
                  color: "#69606c",
                  minHeight: 56,
                  lineHeight: 1.6,
                }}
              >
                {meta.intro}
              </div>
            </section>
          </div>

          <div style={{ padding: "14px 18px 26px", display: "grid", gap: 12 }}>
            <Link
              href={`/phone-items/moments/${characterKey}`}
              className="link-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 20px",
                fontSize: 20,
                fontWeight: 700,
                borderRadius: 22,
                background: "rgba(255,255,255,0.12)",
              }}
            >
              <span>모멘트</span>
              <span style={{ color: "#de9fc2", fontWeight: 800 }}>
                {momentCount}
              </span>
            </Link>

            <Link
              href={`/phone-items/messages/${characterKey}/history`}
              className="link-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 20px",
                fontSize: 20,
                fontWeight: 700,
                borderRadius: 22,
                background: "rgba(255,255,255,0.12)",
              }}
            >
              <span>문자 목록</span>
              <span style={{ color: "#de9fc2", fontWeight: 800 }}>
                {messageCount}
              </span>
            </Link>

            <Link
              href={`/phone-items/calls/${characterKey}/history`}
              className="link-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 20px",
                fontSize: 20,
                fontWeight: 700,
                borderRadius: 22,
                background: "rgba(255,255,255,0.12)",
              }}
            >
              <span>통화 목록</span>
              <span style={{ color: "#de9fc2", fontWeight: 800 }}>
                {callCount}
              </span>
            </Link>

            <div
              className="link-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 20px",
                fontSize: 20,
                fontWeight: 700,
                borderRadius: 22,
                background: "rgba(255,255,255,0.12)",
              }}
            >
              <span>기록 수집</span>
              <span style={{ color: "#de9fc2", fontWeight: 800 }}>
                {totalCollected}
              </span>
            </div>

            <div
              className="link-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 20px",
                fontSize: 20,
                fontWeight: 700,
                borderRadius: 22,
                background: "rgba(255,255,255,0.12)",
              }}
            >
              <span>채팅 배경 변경</span>
              <span>나중에</span>
            </div>

            <div
              className="link-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 20px",
                fontSize: 20,
                fontWeight: 700,
                borderRadius: 22,
                background: "rgba(255,255,255,0.12)",
              }}
            >
              <span>통화 배경 변경</span>
              <span>나중에</span>
            </div>

            <div style={{ marginTop: 6 }}>
              <Link href="/phone-items/me" className="nav-link">
                나 페이지로
              </Link>
            </div>
          </div>
        </div>
      </PhoneProfileShell>
    </main>
  );
}