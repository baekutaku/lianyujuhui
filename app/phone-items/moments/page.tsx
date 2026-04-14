import Link from "next/link";
import { notFound } from "next/navigation";
import PhoneShell from "@/components/phone/PhoneShell";
import PhoneTopBar from "@/components/phone/PhoneTopBar";
import PhoneTabNav from "@/components/phone/PhoneTabNav";
import MomentFeedFilterButton from "@/components/phone/moment/MomentFeedFilterButton";
import MomentFeedPost, {
  type MomentFeedItem,
} from "@/components/phone/moment/MomentFeedPost";
import { supabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin-auth";
import {
  MOMENT_AUTHOR_LABEL_MAP,
  MOMENT_CATEGORY_LABEL_MAP,
  normalizeMomentAuthor,
  normalizeMomentCategory,
} from "@/lib/phone/moment-filters";

type MomentFeedListItem = MomentFeedItem & {
  categoryKey: string;
  yearText: string;
  createdAt: string;
};

const DEFAULT_AVATAR_MAP: Record<string, string> = {
  baiqi: "/profile/baiqi.png",
  lizeyan: "/profile/lizeyan.png",
  zhouqiluo: "/profile/zhouqiluo.png",
  xumo: "/profile/xumo.png",
  lingxiao: "/profile/lingxiao.png",
  mc: "/profile/mc.png",
  other: "/profile/npc.png",
};

const MAIN_CHARACTER_ORDER = [
  "baiqi",
  "lizeyan",
  "zhouqiluo",
  "xumo",
  "lingxiao",
] as const;

const AUTHOR_FILTER_OPTIONS = [
  { key: "baiqi", label: "백기" },
  { key: "lizeyan", label: "이택언" },
  { key: "zhouqiluo", label: "주기락" },
  { key: "xumo", label: "허묵" },
  { key: "lingxiao", label: "연시호" },
  { key: "mc", label: "유연" },
  { key: "other", label: "기타/NPC" },
];

type PageProps = {
  searchParams?: Promise<{
    author?: string;
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
    momentCategoryLabel?: string;
    momentYear?: number | string;
    momentDateText?: string;
    momentBody?: string;
    momentSummary?: string;
    momentSource?: string;
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

function getAuthorPriority(authorKey: string) {
  if (authorKey === "baiqi") return 0;
  if (
    authorKey === "lizeyan" ||
    authorKey === "zhouqiluo" ||
    authorKey === "xumo" ||
    authorKey === "lingxiao"
  ) {
    return 1;
  }
  if (authorKey === "mc") return 2;
  return 3;
}

export default async function MomentsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedAuthor = normalizeMomentAuthor(resolvedSearchParams?.author);
  const selectedCategories = parseCsvParam(resolvedSearchParams?.category);
  const selectedReply = normalizeReplyFilter(resolvedSearchParams?.reply);
  const selectedYears = parseCsvParam(resolvedSearchParams?.year);
  const admin = await isAdmin();

  const { data, error } = await supabase
    .from("phone_items")
    .select(
      "id, title, slug, created_at, release_year, is_published, content_json"
    )
    .eq("subtype", "moment")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) notFound();

  const rows = (data as MomentRow[] | null) ?? [];

  const allItems: MomentFeedListItem[] = rows
  .map((row) => {
    const slug = row.slug?.trim() || "";
    if (!slug) return null;

    const authorKey = row.content_json?.authorKey?.trim() || "other";
    const categoryKey = normalizeMomentCategory(
      row.content_json?.momentCategory
    );

    const imageUrls = Array.isArray(row.content_json?.momentImageUrls)
      ? row.content_json!.momentImageUrls!.filter(Boolean)
      : [];

    const replyLines = Array.isArray(row.content_json?.momentReplyLines)
      ? row.content_json!.momentReplyLines!.filter(
          (line) => line && String(line.content ?? "").trim()
        )
      : [];

    const choiceOptions = Array.isArray(row.content_json?.momentChoiceOptions)
      ? row.content_json!.momentChoiceOptions!.map((option, index) => ({
          id: option.id?.trim() || `option-${index + 1}`,
          label: option.label?.trim() || `선택지 ${index + 1}`,
          isHistory: Boolean(option.isHistory ?? false),
          replySpeakerKey: option.replySpeakerKey?.trim() || "",
          replySpeakerName: option.replySpeakerName?.trim() || "",
          replyTargetName: option.replyTargetName?.trim() || "",
          replyContent: option.replyContent?.trim() || "",
        }))
      : [];

    const selectedOptionId =
      row.content_json?.momentSelectedOptionId?.trim() || null;

    const activeChoice =
      choiceOptions.find((option) => option.id === selectedOptionId) || null;

    return {
      id: String(row.id),
      slug,
      authorKey,
      authorName:
        row.content_json?.authorName?.trim() ||
        MOMENT_AUTHOR_LABEL_MAP[authorKey] ||
        "기타",
      authorAvatarUrl:
        row.content_json?.authorAvatarUrl?.trim() ||
        DEFAULT_AVATAR_MAP[authorKey] ||
        "/profile/npc.png",
      authorHasProfile: Boolean(row.content_json?.authorHasProfile),
      dateText: getDateText(row),
      body: row.content_json?.momentBody?.trim() || "",
      imageUrls,
      replyLines,
      activeChoice,
      isFavorite: Boolean(row.content_json?.isFavorite ?? false),
      categoryKey,
      yearText: getYearText(row),
      createdAt: row.created_at,
    };
  })
  .filter((item): item is MomentFeedListItem => item !== null);

  const availableYears = Array.from(
    new Set(allItems.map((item) => item.yearText).filter(Boolean))
  ).sort((a, b) => Number(b) - Number(a));

  const filteredItems = allItems
    .filter((item) => {
      const authorMatched =
        selectedAuthor === "all"
          ? true
          : selectedAuthor === "other"
            ? !MAIN_CHARACTER_ORDER.includes(
                item.authorKey as (typeof MAIN_CHARACTER_ORDER)[number]
              ) && item.authorKey !== "mc"
            : item.authorKey === selectedAuthor;

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

      return authorMatched && categoryMatched && replyMatched && yearMatched;
    })
    .sort((a, b) => {
      const priorityDiff =
        getAuthorPriority(a.authorKey) - getAuthorPriority(b.authorKey);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <main className="phone-page">
      <PhoneShell>
        <PhoneTopBar
          title="모멘트"
          subtitle={`${filteredItems.length}개`}
          backHref="/phone-items"
          rightSlot={
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {admin ? (
                <Link
                  href="/admin/phone-items/new?subtype=moment"
                  className="history-top-admin-btn"
                  aria-label="모멘트 추가"
                  title="모멘트 추가"
                >
                  <span className="material-symbols-rounded">add</span>
                </Link>
              ) : null}

              <MomentFeedFilterButton
                basePath="/phone-items/moments"
                showAuthor
                authorOptions={AUTHOR_FILTER_OPTIONS}
                selectedAuthor={selectedAuthor}
                selectedCategories={selectedCategories}
                selectedReply={selectedReply}
                selectedYears={selectedYears}
                availableYears={availableYears}
              />
            </div>
          }
        />

        <div className="phone-content">
          <div style={{ display: "grid", gap: 0 }}>
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