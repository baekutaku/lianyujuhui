import Link from "next/link";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import MomentFeedFilterButton from "@/components/phone/moment/MomentFeedFilterButton";
import MomentFeedPost, {
  type MomentFeedItem,
} from "@/components/phone/moment/MomentFeedPost";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import { normalizeMomentCategory } from "@/lib/phone/moment-filters";
import { getCurrentViewerProfile } from "@/lib/phone/get-current-viewer-profile";

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
  mc: "유연",
  other: "기타",
};

type PageProps = {
  params: Promise<{
    characterKey: string;
  }>;
  searchParams?: Promise<{
    category?: string;
    reply?: string;
    year?: string;
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
    authorHasProfile?: boolean;
    momentCategory?: string;
    momentYear?: number | string;
    momentDateText?: string;
    momentBody?: string;
    momentImageUrls?: string[];
    momentReplyLines?: Array<{
      speakerKey?: string;
      speakerName?: string;
      targetName?: string;
      content?: string;
      isReplyToMc?: boolean;
    }>;
    momentChoiceOptions?: Array<{
      id?: string;
      label?: string;
      isHistory?: boolean;
      replySpeakerKey?: string;
      replySpeakerName?: string;
      replyTargetName?: string;
      replyContent?: string;
    }>;
    momentSelectedOptionId?: string;
    isFavorite?: boolean;
  } | null;
};

function parseCsvParam(value?: string) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeReplyFilter(value?: string): "all" | "replied" | "unreplied" {
  if (value === "replied" || value === "unreplied") return value;
  return "all";
}

function getYearText(row: MomentRow) {
  const raw = row.content_json?.momentYear ?? row.release_year;
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return "";
}

function getDateText(row: MomentRow) {
  const raw = row.content_json?.momentDateText?.trim();
  if (raw) return raw;

  const createdAt = row.created_at?.trim();
  if (!createdAt) return "";

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export default async function CharacterMomentsPage({
  params,
  searchParams,
}: PageProps) {
  const { characterKey } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedCategories = parseCsvParam(resolvedSearchParams?.category);
  const selectedReply = normalizeReplyFilter(resolvedSearchParams?.reply);
  const selectedYears = parseCsvParam(resolvedSearchParams?.year);
  const admin = await isAdmin();
  const viewerProfile = await getCurrentViewerProfile();
const isViewerMoment = characterKey === "mc";
console.log("viewerProfile", viewerProfile);

  const { data, error } = await supabase
    .from("phone_items")
    .select(
      "id, title, slug, created_at, release_year, is_published, content_json"
    )
    .eq("subtype", "moment")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("모멘트 데이터를 불러오지 못했습니다.");
  }

  const rows = ((data as MomentRow[] | null) ?? []).filter((row) => {
    const authorKey = row.content_json?.authorKey?.trim() || "other";
    return authorKey === characterKey;
  });

  const authorName = isViewerMoment
  ? viewerProfile.displayName
  : rows[0]?.content_json?.authorName?.trim() ||
    DEFAULT_NAME_MAP[characterKey] ||
    "이름 없음";

  const allItems: Array<
    MomentFeedItem & {
      categoryKey: string;
      yearText: string;
    }
  > = rows
    .map((row) => {
      const slug = row.slug?.trim() || "";
      if (!slug) return null;

      const imageUrls = Array.isArray(row.content_json?.momentImageUrls)
        ? row.content_json!.momentImageUrls!.filter(Boolean)
        : [];

   const replyLines = Array.isArray(row.content_json?.momentReplyLines)
  ? row.content_json!.momentReplyLines!
      .filter((line) => line && String(line.content ?? "").trim())
      .map((line) => ({
        ...line,
        speakerName:
          line.speakerKey?.trim() === "mc"
            ? viewerProfile.displayName
            : line.speakerName?.trim() || "",
        targetName: line.isReplyToMc
          ? line.targetName?.trim() || viewerProfile.displayName
          : line.targetName?.trim() || "",
      }))
  : [];
     const choiceOptions = Array.isArray(row.content_json?.momentChoiceOptions)
  ? row.content_json!.momentChoiceOptions!.map((option, index) => {
      const replySpeakerKey = option.replySpeakerKey?.trim() || "";
      const replyTargetName = option.replyTargetName?.trim() || "";

      return {
        id: option.id?.trim() || `option-${index + 1}`,
        label: option.label?.trim() || `선택지 ${index + 1}`,
        isHistory: Boolean(option.isHistory ?? false),
        replySpeakerKey,
        replySpeakerName:
          replySpeakerKey === "mc"
            ? viewerProfile.displayName
            : option.replySpeakerName?.trim() || "",
        replyTargetName: replyTargetName || viewerProfile.displayName,
        replyContent: option.replyContent?.trim() || "",
      };
    })
  : [];

      const selectedOptionId =
        row.content_json?.momentSelectedOptionId?.trim() || null;

      const activeChoice =
        choiceOptions.find((option) => option.id === selectedOptionId) || null;

      return {
        id: String(row.id),
        slug,
        authorKey: characterKey,
       authorName:
  isViewerMoment
    ? viewerProfile.displayName
    : row.content_json?.authorName?.trim() ||
      DEFAULT_NAME_MAP[characterKey] ||
      authorName,

authorAvatarUrl:
  isViewerMoment
    ? viewerProfile.avatarUrl
    : row.content_json?.authorAvatarUrl?.trim() ||
      DEFAULT_AVATAR_MAP[characterKey] ||
      "/profile/npc.png",
        authorHasProfile: Boolean(row.content_json?.authorHasProfile),
        dateText: getDateText(row),
        body: row.content_json?.momentBody?.trim() || "",
        imageUrls,
        replyLines,
        activeChoice,
        isFavorite: Boolean(row.content_json?.isFavorite ?? false),
        categoryKey: normalizeMomentCategory(row.content_json?.momentCategory),
        yearText: getYearText(row),
      };
    })
    .filter(Boolean) as Array<
    MomentFeedItem & {
      categoryKey: string;
      yearText: string;
    }
  >;

  const availableYears = Array.from(
    new Set(allItems.map((item) => item.yearText).filter(Boolean))
  ).sort((a, b) => Number(b) - Number(a));

  const filteredItems = allItems.filter((item) => {
    const categoryMatched =
      selectedCategories.length === 0
        ? true
        : selectedCategories.includes(item.categoryKey);

    const hasReply = Boolean(item.activeChoice || item.replyLines.length);

    const replyMatched =
      selectedReply === "all"
        ? true
        : selectedReply === "replied"
          ? hasReply
          : !hasReply;

    const yearMatched =
      selectedYears.length === 0
        ? true
        : selectedYears.includes(item.yearText);

    return categoryMatched && replyMatched && yearMatched;
  });

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title={`${authorName} · 모멘트`}
          subtitle={`${filteredItems.length}개`}
          backHref={`/phone-items/me/${characterKey}`}
          rightSlot={
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
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
                className="phone-topbar-icon-button"
                aria-label="모멘트 히스토리"
                title="모멘트 히스토리"
              >
                <span className="material-symbols-rounded">more_horiz</span>
              </Link>

              <MomentFeedFilterButton
                basePath={`/phone-items/moments/${characterKey}`}
                selectedCategories={selectedCategories}
                selectedReply={selectedReply}
                selectedYears={selectedYears}
                availableYears={availableYears}
              />
            </div>
          }
        />

        <div className="phone-content">
          <div className="moment-feed-list">
            {filteredItems.map((item) => (
              <MomentFeedPost key={item.id} item={item} />
            ))}
          </div>
        </div>

        <PhoneTabNav currentPath="/phone-items/moments" />
      </PhoneShell>
    </main>
  );
}