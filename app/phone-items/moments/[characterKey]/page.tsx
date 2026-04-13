import Link from "next/link";
import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import MomentChoiceTrigger from "@/components/phone/moment/MomentChoiceTrigger";

const DEFAULT_AVATAR_MAP: Record<string, string> = {
  baiqi: "/profile/baiqi.png",
  lizeyan: "/profile/lizeyan.png",
  zhouqiluo: "/profile/zhouqiluo.png",
  xumo: "/profile/xumo.png",
  lingxiao: "/profile/lingxiao.png",
  mc: "/profile/mc.png",
  other: "/profile/npc.png",
};

const DEFAULT_NAME_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
  mc: "나",
  other: "기타",
};

type PageProps = {
  params: Promise<{
    characterKey: string;
  }>;
};

type MomentRow = {
  id: string;
  title: string | null;
  slug: string | null;
  created_at: string;
  release_year?: number | null;
  is_published?: boolean | null;
  content_json?: {
    authorKey?: string;
    authorName?: string;
    authorAvatarUrl?: string;
    momentCategory?: string;
    momentCategoryLabel?: string;
    momentYear?: number | string;
    momentDateText?: string;
    momentBody?: string;
    momentSummary?: string;
    momentSource?: string;
    isFavorite?: boolean;
    isComplete?: boolean;
    momentChoiceOptions?: Array<{
      id?: string;
      label?: string;
      isHistory?: boolean;
    }>;
    momentSelectedOptionId?: string;
  } | null;
};

function getPreview(row: MomentRow) {
  const body = row.content_json?.momentBody?.trim();
  const summary = row.content_json?.momentSummary?.trim();
  const title = row.title?.trim();

  return body || summary || title || "내용 없음";
}

function getDateText(row: MomentRow) {
  const raw = row.content_json?.momentDateText?.trim();
  if (raw) return raw;

  const createdAt = row.created_at?.trim();
  if (!createdAt) return "";

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export default async function CharacterMomentsPage({ params }: PageProps) {
  const { characterKey } = await params;
  const admin = await isAdmin();

  const { data, error } = await supabase
    .from("phone_items")
    .select("id, title, slug, created_at, release_year, is_published, content_json")
    .eq("subtype", "moment")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) notFound();

  const rows = ((data as MomentRow[] | null) ?? []).filter((row) => {
    const authorKey = row.content_json?.authorKey?.trim() || "other";
    return authorKey === characterKey;
  });

  if (!rows.length) notFound();

  const authorName =
    rows[0]?.content_json?.authorName?.trim() ||
    DEFAULT_NAME_MAP[characterKey] ||
    "이름 없음";

  const authorAvatarUrl =
    rows[0]?.content_json?.authorAvatarUrl?.trim() ||
    DEFAULT_AVATAR_MAP[characterKey] ||
    "/profile/npc.png";

  const items = rows
    .map((row) => {
      const slug = row.slug?.trim() || "";
      if (!slug) return null;

      return {
        id: String(row.id),
        slug,
        authorKey: row.content_json?.authorKey?.trim() || characterKey,
        authorName:
          row.content_json?.authorName?.trim() ||
          DEFAULT_NAME_MAP[characterKey] ||
          authorName,
        authorAvatarUrl:
          row.content_json?.authorAvatarUrl?.trim() ||
          DEFAULT_AVATAR_MAP[characterKey] ||
          "/profile/npc.png",
        title: row.title?.trim() || "제목 없음",
        categoryLabel:
          row.content_json?.momentCategoryLabel?.trim() ||
          row.content_json?.momentCategory?.trim() ||
          "일상",
        dateText: getDateText(row),
        summary: row.content_json?.momentSummary?.trim() || "",
        source: row.content_json?.momentSource?.trim() || "",
        preview: getPreview(row),
        isFavorite: Boolean(row.content_json?.isFavorite ?? false),
        isComplete: Boolean(row.content_json?.isComplete ?? true),
        choiceOptions: Array.isArray(row.content_json?.momentChoiceOptions)
          ? row.content_json!.momentChoiceOptions!.map((option, index) => ({
              id: option.id?.trim() || `option-${index + 1}`,
              label: option.label?.trim() || `선택지 ${index + 1}`,
              isHistory: Boolean(option.isHistory ?? false),
            }))
          : [],
        selectedOptionId: row.content_json?.momentSelectedOptionId?.trim() || null,
      };
    })
    .filter(Boolean) as Array<{
      id: string;
      slug: string;
      authorKey: string;
      authorName: string;
      authorAvatarUrl: string;
      title: string;
      categoryLabel: string;
      dateText: string;
      summary: string;
      source: string;
      preview: string;
      isFavorite: boolean;
      isComplete: boolean;
      choiceOptions: Array<{
        id: string;
        label: string;
        isHistory?: boolean;
      }>;
      selectedOptionId: string | null;
    }>;

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title={`${authorName} · 모멘트`}
          subtitle={`${items.length}개`}
          backHref={`/phone-items/me/${characterKey}`}
          rightSlot={
            <div className="history-top-admin">
              {admin ? (
                <>
                  <Link
                    href={`/admin/phone-items/new?subtype=moment&authorKey=${characterKey}`}
                    className="history-top-admin-btn"
                    aria-label="모멘트 추가"
                    title="모멘트 추가"
                  >
                    <span className="material-symbols-rounded">add</span>
                  </Link>

                  <Link
                    href="/admin/phone-items"
                    className="history-top-admin-btn"
                    aria-label="휴대폰 관리"
                    title="휴대폰 관리"
                  >
                    <span className="material-symbols-rounded">settings</span>
                  </Link>
                </>
              ) : null}

              <Link
                href={`/phone-items/moments/${characterKey}/history`}
                className="history-top-admin-btn"
                aria-label="히스토리"
                title="히스토리"
              >
                <span className="material-symbols-rounded">more_horiz</span>
              </Link>

              <button
                type="button"
                className="phone-topbar-icon-button"
                aria-label="필터"
                title="필터"
              >
                <span className="material-symbols-rounded">search</span>
              </button>
            </div>
          }
        />

        <div className="phone-content">
          <div className="message-history-page">
            <div className="message-history-grid">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="message-history-card"
                  style={{ position: "relative" }}
                >
                  <div className="message-history-card-top">
                    <Link
                      href={`/phone-items/me/${item.authorKey}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        textDecoration: "none",
                        color: "inherit",
                        minWidth: 0,
                      }}
                    >
                      <img
                        src={item.authorAvatarUrl}
                        alt={item.authorName}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "999px",
                          objectFit: "cover",
                          flex: "0 0 auto",
                        }}
                      />
                      <span className="message-history-badge">{item.authorName}</span>
                    </Link>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {item.choiceOptions.length ? (
                        <MomentChoiceTrigger
                          title={item.title}
                          options={item.choiceOptions}
                          selectedOptionId={item.selectedOptionId}
                        />
                      ) : null}

                      {item.isFavorite ? (
                        <span className="message-history-heart">♡</span>
                      ) : (
                        <span className="message-history-steam">〰</span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/phone-items/moments/${item.slug}`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      display: "contents",
                    }}
                  >
                    <div className="message-history-title-row">
                      <span className="message-history-title">{item.title}</span>
                      {!item.isComplete ? (
                        <span className="message-history-status">[미완료]</span>
                      ) : null}
                    </div>

                    <div className="message-history-meta-summary">
                      {item.categoryLabel}
                      {item.dateText ? ` · ${item.dateText}` : ""}
                    </div>

                    {item.summary ? (
                      <div className="message-history-meta-source">{item.summary}</div>
                    ) : null}

                    {item.source ? (
                      <div className="message-history-meta-source">{item.source}</div>
                    ) : null}

                    <div className="message-history-preview">{item.preview}</div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <PhoneTabNav currentPath="/phone-items/moments" />
      </PhoneShell>
    </main>
  );
}