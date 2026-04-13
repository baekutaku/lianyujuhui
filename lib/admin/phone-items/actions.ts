"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import {
  parseMessageBulk,
  parseMomentBulk,
} from "@/lib/admin/phoneBulkParsers";
import { CALL_HISTORY_CATEGORY_LABEL_MAP } from "@/lib/phone/call-history";

function slugify(input: string) {
  return (
    String(input || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "item"
  );
}

function toEmbedUrl(raw: string) {
  const value = raw.trim();
  if (!value) return "";

  if (value.includes("/embed/")) return value;

  const watchMatch = value.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const shortMatch = value.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  const shortsMatch = value.match(/youtube\.com\/shorts\/([^?&/]+)/);
  if (shortsMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  }

  return value;
}

function parseJsonField<T>(value: string, fieldName: string, fallback: T): T {
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error(`${fieldName} JSON이 올바르지 않습니다.`);
  }
}



function makeContentId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function buildMomentSlug(params: {
  authorKey: string;
  title: string;
  fallback?: string;
}) {
  const author = slugify(params.authorKey || "other");
  const base = slugify(params.title || params.fallback || "moment");
  return `${author}-${base}`;
}

function parseJsonFieldOptional<T>(value: string, fieldName: string, fallback: T): T {
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error(`${fieldName} JSON이 올바르지 않습니다.`);
  }
}

function parseLineSeparatedUrls(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function resolveServerAndCharacterIds(
  serverKey: string,
  characterKey?: string
) {
  const { data: server } = await supabase
    .from("servers")
    .select("id")
    .eq("key", serverKey || "kr")
    .maybeSingle();

  let characterId: string | null = null;

  if (characterKey) {
    const { data: character } = await supabase
      .from("characters")
      .select("id")
      .eq("key", characterKey)
      .maybeSingle();

    characterId = character?.id ?? null;
  }

  return {
    serverId: server?.id ?? null,
    characterId,
  };
}

const RESERVED_PHONE_SLUGS = new Set([

  
  "edit",
  "new",
  "calls",
  "messages",
  "moments",
  "articles",
  "me",
  "characters",
])

type CreatedPhoneItem = {
  id: string;
  slug: string;
};
;

function assertPhoneSlugAllowed(rawSlug: string) {
  const normalized = slugify(rawSlug);
  if (normalized && RESERVED_PHONE_SLUGS.has(normalized)) {
    throw new Error(`"${rawSlug}"는 예약된 slug라 사용할 수 없습니다.`);
  }
}



function buildPhoneItemSlug(params: {
  subtype: string;
  characterKey: string;
  title: string;
  fallback?: string;
}) {
  const base = slugify(params.title || params.fallback || params.subtype);
  const character = slugify(params.characterKey || "common");
  let slug = `${character}-${base}`;

  if (RESERVED_PHONE_SLUGS.has(slug)) {
    slug = `${slug}-item`;
  }

  return slug;
}

function revalidatePhoneItemPaths(
  rawSlug: string,
  phoneItemId?: string,
  extraPaths: string[] = []
) {
  const safeSlug = encodeURIComponent(rawSlug || "item");

  revalidatePath("/admin/phone-items");
  revalidatePath("/phone-items");
  revalidatePath("/phone-items/articles");
  revalidatePath("/phone-items/calls");
  revalidatePath("/phone-items/messages");
  revalidatePath("/phone-items/moments");

  if (phoneItemId) {
    revalidatePath(`/admin/phone-items/${phoneItemId}/edit`);
  }

  revalidatePath(`/phone-items/articles/${safeSlug}`);
  revalidatePath(`/phone-items/moments/${safeSlug}`);

  for (const path of extraPaths) {
    revalidatePath(path);
  }
}


async function createArticlePhoneItem(params: {
  rawSlug: string;
  title: string;
  subtype: string;
  summary: string;
  isPublished: boolean;
  formData: FormData;
}): Promise<CreatedPhoneItem> {
  const serverKey = String(params.formData.get("server_key") || "kr").trim();
  const releaseYear = new Date().getFullYear();

  const preview = String(params.formData.get("article_preview") || "").trim();
  const iconUrl = String(params.formData.get("article_icon_url") || "").trim();
  const imageUrl = String(params.formData.get("article_image_url") || "").trim();
  const sourceName = String(params.formData.get("article_publisher") || "").trim();
  const sourceSlugRaw = String(
    params.formData.get("article_publisher_slug") || ""
  ).trim();
  const sourceSlug = sourceSlugRaw || slugify(sourceName || "news");
  const author = String(params.formData.get("article_author") || "").trim();
  const body = String(params.formData.get("article_body") || "").trim();

  const subscriberCountRaw = String(
    params.formData.get("article_subscriber_count") || ""
  ).trim();
  const subscriberCount = subscriberCountRaw ? Number(subscriberCountRaw) : 0;

  const likeCountRaw = String(
    params.formData.get("article_like_count") || ""
  ).trim();
  const likeCount = likeCountRaw ? Number(likeCountRaw) : 0;

  const relatedStorySlug = String(
    params.formData.get("article_related_story_slug") || ""
  ).trim();
  const relatedStoryLabel = String(
    params.formData.get("article_related_story_label") || ""
  ).trim();

  const relatedEventSlug = String(
    params.formData.get("article_related_event_slug") || ""
  ).trim();
  const relatedEventLabel = String(
    params.formData.get("article_related_event_label") || ""
  ).trim();

  const comments = [0, 1, 2, 3]
    .map((index) => {
      const avatarUrl = String(
        params.formData.get(`article_comment_${index}_avatar_url`) || ""
      ).trim();
      const nickname = String(
        params.formData.get(`article_comment_${index}_nickname`) || ""
      ).trim();
      const content = String(
        params.formData.get(`article_comment_${index}_content`) || ""
      ).trim();
      const likeCountRaw = String(
        params.formData.get(`article_comment_${index}_like_count`) || ""
      ).trim();
      const likeCount = likeCountRaw ? Number(likeCountRaw) : 0;

      if (!nickname && !content) return null;

      return {
        avatarUrl,
        nickname,
        content,
        likeCount,
      };
    })
    .filter(Boolean);

  const articleTitle = params.title || preview || "기사";

const finalSlug =
  params.rawSlug ||
  slugify(articleTitle || preview || "article");

  const { serverId } = await resolveServerAndCharacterIds(serverKey);

  const { data, error } = await supabase
    .from("phone_items")
    .insert({
      content_id: makeContentId("phone-article"),
      origin_key: `${sourceSlug}:${finalSlug}`,
      server_id: serverId,
      primary_character_id: null,
      title: articleTitle,
      slug: finalSlug,
      subtype: params.subtype,
      release_year: releaseYear,
      preview_text: preview,
      summary: params.summary || preview || body.slice(0, 60),
      is_published: params.isPublished,
      content_json: {
        preview,
        iconUrl,
        imageUrl,
        sourceName,
        sourceSlug,
        author,
        body,
        subscriberCount,
        likeCount,
        relatedStorySlug,
        relatedStoryLabel,
        relatedEventSlug,
        relatedEventLabel,
        comments,
      },
    })
    .select("id, slug")
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    slug: data.slug,
  };
}

async function createMessagePhoneItem(params: {
  rawSlug: string;
  title: string;
  isPublished: boolean;
  formData: FormData;
}): Promise<CreatedPhoneItem> {
  const serverKey = String(params.formData.get("server_key") || "kr").trim();
  const releaseYear = new Date().getFullYear();

  const preview = String(params.formData.get("preview") || "").trim();
  const threadKey = String(params.formData.get("thread_key") || "").trim();
  const characterKey = String(params.formData.get("character_key") || "").trim();
  const characterName = String(params.formData.get("character_name") || "").trim();
  const avatarUrl = String(params.formData.get("avatar_url") || "").trim();
  const levelRaw = String(params.formData.get("level") || "").trim();
  const level = levelRaw ? Number(levelRaw) : null;

  const historySummary = String(params.formData.get("history_summary") || "").trim();
const historySource = String(params.formData.get("history_source") || "").trim();
const historyCategory =
  String(params.formData.get("history_category") || "").trim() || "story";

  const raw = String(params.formData.get("message_bulk_raw") || "").trim();
  const entriesJson = String(params.formData.get("entries_json") || "").trim();
  const editorEntriesJson = String(
    params.formData.get("editor_entries_json") || ""
  ).trim();

  const categoryLabelMap: Record<string, string> = {
    daily: "일상",
    companion: "동반",
    card_story: "카드",
    main_story: "메인스토리",
  };

  const entries = entriesJson
    ? parseJsonField<unknown[]>(entriesJson, "entries_json", [])
    : raw
      ? parseMessageBulk(raw)
      : [];

  const editorEntries = editorEntriesJson
    ? parseJsonField<unknown[]>(
        editorEntriesJson,
        "editor_entries_json",
        entries
      )
    : entries;

const finalThreadKey =
  threadKey ||
  `${characterKey}-${Date.now().toString(36)}`;

const finalSlug =
  params.rawSlug ||
  buildPhoneItemSlug({
    subtype: "message",
    characterKey,
    title: params.title || `${characterName || characterKey} 메시지`,
    fallback: preview,
  });

  const { serverId, characterId } = await resolveServerAndCharacterIds(
    serverKey,
    characterKey
  );

  const { data, error } = await supabase
    .from("phone_items")
    .insert({
      content_id: makeContentId("phone-message"),
      origin_key: finalThreadKey,
      server_id: serverId,
      primary_character_id: characterId,
  title: params.title || `${characterName || characterKey} 메시지`,
      slug: finalSlug,
      subtype: "message",
      release_year: releaseYear,
      preview_text: preview,
      summary: historySummary || preview,
      is_published: params.isPublished,
      content_json: {
        threadKey: finalThreadKey,
        characterKey,
        characterName,
        avatarUrl,
        level,
        historyCategory,
        historyCategoryLabel: categoryLabelMap[historyCategory] || "일상",
        historySummary,
        historySource,
        preview,
        entries,
        editorEntries,
      },
    })
    .select("id, slug")
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    slug: data.slug,
  };
}

async function createMomentPhoneItem(params: {
  rawSlug: string;
  isPublished: boolean;
  formData: FormData;
}): Promise<CreatedPhoneItem> {
  const serverKey = String(params.formData.get("server_key") || "kr").trim();
  const releaseYear = new Date().getFullYear();

  const authorKey = String(params.formData.get("moment_author_key") || "other").trim();
  const authorName = String(params.formData.get("moment_author_name") || "").trim();
  const authorAvatarUrl = String(
    params.formData.get("moment_author_avatar_url") || ""
  ).trim();
  const authorHasProfile =
    params.formData.get("moment_author_has_profile") === "on";

  const momentTitle = String(params.formData.get("moment_title") || "").trim();
  const momentSlugRaw = String(params.formData.get("moment_slug") || "").trim();
  const momentCategory = String(params.formData.get("moment_category") || "daily").trim();
  const momentYearRaw = String(params.formData.get("moment_year") || "").trim();
  const momentDateText = String(params.formData.get("moment_date_text") || "").trim();

  const momentBody = String(params.formData.get("moment_body") || "").trim();
  const momentSummary = String(params.formData.get("moment_summary") || "").trim();
  const momentSource = String(params.formData.get("moment_source") || "").trim();

  const momentImageUrlsText = String(
    params.formData.get("moment_image_urls_text") || ""
  ).trim();

  const momentReplyLinesJson = String(
    params.formData.get("moment_reply_lines_json") || ""
  ).trim();

  const momentChoiceOptionsJson = String(
    params.formData.get("moment_choice_options_json") || ""
  ).trim();

  const momentCommentsJson = String(
    params.formData.get("moment_comments_json") || ""
  ).trim();

  const momentIsFavorite = params.formData.get("moment_is_favorite") === "on";
  const momentIsComplete = params.formData.get("moment_is_complete") === "on";

  const momentImageUrls = parseLineSeparatedUrls(momentImageUrlsText);

  const momentReplyLines = parseJsonFieldOptional<
  Array<{
    speakerKey?: string;
    speakerName?: string;
    targetName?: string;
    content?: string;
    isReplyToMc?: boolean;
  }>
>(momentReplyLinesJson, "moment_reply_lines_json", []);

const momentChoiceOptions = parseJsonFieldOptional<
  Array<{
    id?: string;
    label?: string;
    isHistory?: boolean;
    replySpeakerKey?: string;
    replySpeakerName?: string;
    replyTargetName?: string;
    replyContent?: string;
  }>
>(momentChoiceOptionsJson, "moment_choice_options_json", []);

const momentComments = parseJsonFieldOptional<
  Array<{
    speakerKey?: string;
    avatarUrl?: string;
    nickname?: string;
    content?: string;
    likeCount?: number;
  }>
>(momentCommentsJson, "moment_comments_json", []);

  const momentCategoryLabelMap: Record<string, string> = {
    daily: "일상",
    card: "카드",
    story: "스토리",
  };

  const finalSlug =
    momentSlugRaw ||
    params.rawSlug ||
    buildMomentSlug({
      authorKey,
      title: momentTitle,
      fallback: momentBody.slice(0, 30),
    });

  const { serverId, characterId } = await resolveServerAndCharacterIds(
    serverKey,
    authorHasProfile && authorKey !== "mc" && authorKey !== "other" ? authorKey : ""
  );

const historyChoice = momentChoiceOptions.find((option) => {
  const optionId = String(option?.id || "").trim();
  return optionId && option.isHistory;
});

const selectedOptionId = historyChoice
  ? String(historyChoice.id || "").trim()
  : momentChoiceOptions.length > 0
    ? String(momentChoiceOptions[0]?.id || "").trim() || "option-1"
    : null;

  const { data, error } = await supabase
    .from("phone_items")
    .insert({
      content_id: makeContentId("phone-moment"),
      origin_key: `${authorKey}-${finalSlug}`,
      server_id: serverId,
      primary_character_id: characterId,
      title: momentTitle || `${authorName || authorKey} 모멘트`,
      slug: finalSlug,
      subtype: "moment",
      release_year: momentYearRaw ? Number(momentYearRaw) : releaseYear,
      preview_text: momentSummary || momentBody.slice(0, 60),
      summary: momentSummary || momentBody.slice(0, 60),
      is_published: params.isPublished,
      content_json: {
        authorKey,
        authorName,
        authorAvatarUrl,
        authorHasProfile,
        momentCategory,
        momentCategoryLabel: momentCategoryLabelMap[momentCategory] || "일상",
        momentYear: momentYearRaw ? Number(momentYearRaw) : releaseYear,
        momentDateText,
        momentBody,
        momentSummary,
        momentSource,
        momentImageUrls,
        momentReplyLines,
        momentChoiceOptions,
        momentSelectedOptionId: selectedOptionId,
        momentComments,
        isFavorite: momentIsFavorite,
        isComplete: momentIsComplete,
      },
    })
    .select("id, slug")
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    slug: data.slug,
  };
}

async function updateCallPhoneItem(params: {
  phoneItemId: string;
  rawSlug: string;
  title: string;
  subtype: string;
  summary: string;
  isPublished: boolean;
  formData: FormData;
}) {
  const characterKey = String(params.formData.get("character_key") || "").trim();
  const characterName = String(params.formData.get("character_name") || "").trim();
  const avatarUrl = String(params.formData.get("avatar_url") || "").trim();
  const coverImage = String(params.formData.get("cover_image") || "").trim();
  const youtubeUrl = String(params.formData.get("youtube_url") || "").trim();
  const body = String(params.formData.get("body") || "").trim();
  const levelRaw = String(params.formData.get("level") || "").trim();
  const level = levelRaw ? Number(levelRaw) : null;

  const translationHtml = String(
    params.formData.get("call_translation_html") || ""
  ).trim();

  const memoHtml = String(
    params.formData.get("call_memo_html") || ""
  ).trim();

  const historySummary = String(
    params.formData.get("history_summary") || ""
  ).trim();

  const historySource = String(
    params.formData.get("history_source") || ""
  ).trim();

  const historyCategory =
    String(params.formData.get("history_category") || "").trim() || "story";

  const { error } = await supabase
    .from("phone_items")
    .update({
      title: params.title || `${characterName || characterKey} 통화`,
      slug:
        params.rawSlug ||
        buildPhoneItemSlug({
          subtype: params.subtype,
          characterKey,
          title: params.title,
          fallback: body.slice(0, 30),
        }),
      subtype: params.subtype,
      summary: params.summary || historySummary || body.slice(0, 60),
      is_published: params.isPublished,
      embed_url: toEmbedUrl(youtubeUrl) || null,
      content_json: {
        characterKey,
        characterName,
        avatarUrl,
        level,
        coverImage,
        body,
        translationHtml,
        memoHtml,
        historyCategory,
        historyCategoryLabel:
          CALL_HISTORY_CATEGORY_LABEL_MAP[historyCategory] || "스토리",
        historySummary,
        historySource,
      },
    })
    .eq("id", params.phoneItemId);

  if (error) throw new Error(error.message);
}

async function updateArticlePhoneItem(params: {
  phoneItemId: string;
  rawSlug: string;
  title: string;
  subtype: string;
  summary: string;
  isPublished: boolean;
  formData: FormData;
}) {
  const preview = String(params.formData.get("article_preview") || "").trim();
  const iconUrl = String(params.formData.get("article_icon_url") || "").trim();
  const imageUrl = String(params.formData.get("article_image_url") || "").trim();
  const sourceName = String(params.formData.get("article_publisher") || "").trim();
  const sourceSlugRaw = String(
    params.formData.get("article_publisher_slug") || ""
  ).trim();
  const sourceSlug = sourceSlugRaw || slugify(sourceName || "news");
  const author = String(params.formData.get("article_author") || "").trim();
  const body = String(params.formData.get("article_body") || "").trim();

  const articleTitle = params.title || preview || "기사";
  const nextSlug =
    params.rawSlug || slugify(articleTitle || preview || "article");

  const subscriberCountRaw = String(
    params.formData.get("article_subscriber_count") || ""
  ).trim();
  const subscriberCount = subscriberCountRaw ? Number(subscriberCountRaw) : 0;

  const likeCountRaw = String(
    params.formData.get("article_like_count") || ""
  ).trim();
  const likeCount = likeCountRaw ? Number(likeCountRaw) : 0;

  const relatedStorySlug = String(
    params.formData.get("article_related_story_slug") || ""
  ).trim();
  const relatedStoryLabel = String(
    params.formData.get("article_related_story_label") || ""
  ).trim();

  const relatedEventSlug = String(
    params.formData.get("article_related_event_slug") || ""
  ).trim();
  const relatedEventLabel = String(
    params.formData.get("article_related_event_label") || ""
  ).trim();

  const comments = [0, 1, 2, 3]
    .map((index) => {
      const avatarUrl = String(
        params.formData.get(`article_comment_${index}_avatar_url`) || ""
      ).trim();
      const nickname = String(
        params.formData.get(`article_comment_${index}_nickname`) || ""
      ).trim();
      const content = String(
        params.formData.get(`article_comment_${index}_content`) || ""
      ).trim();
      const likeCountRaw = String(
        params.formData.get(`article_comment_${index}_like_count`) || ""
      ).trim();
      const likeCount = likeCountRaw ? Number(likeCountRaw) : 0;

      if (!nickname && !content) return null;

      return {
        avatarUrl,
        nickname,
        content,
        likeCount,
      };
    })
    .filter(Boolean);

  const { error } = await supabase
    .from("phone_items")
    .update({
      title: articleTitle,
      slug: nextSlug,
      subtype: params.subtype,
      preview_text: preview,
      summary: params.summary || preview || body.slice(0, 60),
      is_published: params.isPublished,
      content_json: {
        preview,
        iconUrl,
        imageUrl,
        sourceName,
        sourceSlug,
        author,
        body,
        subscriberCount,
        likeCount,
        relatedStorySlug,
        relatedStoryLabel,
        relatedEventSlug,
        relatedEventLabel,
        comments,
      },
    })
    .eq("id", params.phoneItemId);

  if (error) throw new Error(error.message);
}

async function updateMessagePhoneItem(params: {
  phoneItemId: string;
  rawSlug: string;
  title: string;
  isPublished: boolean;
  formData: FormData;
}) {
  const preview = String(params.formData.get("preview") || "").trim();
  const threadKey = String(params.formData.get("thread_key") || "").trim();
  const characterKey = String(params.formData.get("character_key") || "").trim();
  const characterName = String(params.formData.get("character_name") || "").trim();
  const avatarUrl = String(params.formData.get("avatar_url") || "").trim();
  const levelRaw = String(params.formData.get("level") || "").trim();
  const level = levelRaw ? Number(levelRaw) : null;

  const historyCategory =
    String(params.formData.get("history_category") || "").trim() || "daily";
  const historySummary =
    String(params.formData.get("history_summary") || "").trim();
  const historySource =
    String(params.formData.get("history_source") || "").trim();

  const raw = String(params.formData.get("message_bulk_raw") || "").trim();
  const entriesJson = String(params.formData.get("entries_json") || "").trim();
  const editorEntriesJson = String(
    params.formData.get("editor_entries_json") || ""
  ).trim();

  const categoryLabelMap: Record<string, string> = {
    daily: "일상",
    companion: "동반",
    card_story: "카드",
    main_story: "메인스토리",
  };

  const entries = entriesJson
    ? parseJsonField<unknown[]>(entriesJson, "entries_json", [])
    : raw
      ? parseMessageBulk(raw)
      : [];

  const editorEntries = editorEntriesJson
    ? parseJsonField<unknown[]>(
        editorEntriesJson,
        "editor_entries_json",
        entries
      )
    : entries;

  const finalThreadKey = threadKey || `${characterKey}-thread`;

const finalSlug =
  params.rawSlug ||
  buildPhoneItemSlug({
    subtype: "message",
    characterKey,
    title: params.title || `${characterName || characterKey} 메시지`,
    fallback: preview,
  });

  const { error } = await supabase
    .from("phone_items")
    .update({
      title: params.title || `${characterName || characterKey} 메시지`,
      slug: finalSlug,
      subtype: "message",
      preview_text: preview,
      summary: historySummary || preview,
      is_published: params.isPublished,
      content_json: {
        threadKey: finalThreadKey,
        characterKey,
        characterName,
        avatarUrl,
        level,
        historyCategory,
        historyCategoryLabel: categoryLabelMap[historyCategory] || "일상",
        historySummary,
        historySource,
        preview,
        entries,
        editorEntries,
      },
    })
    .eq("id", params.phoneItemId);

  if (error) throw new Error(error.message);
}

async function updateMomentPhoneItem(params: {
  phoneItemId: string;
  rawSlug: string;
  isPublished: boolean;
  formData: FormData;
}) {
  const authorKey = String(params.formData.get("moment_author_key") || "other").trim();
  const authorName = String(params.formData.get("moment_author_name") || "").trim();
  const authorAvatarUrl = String(
    params.formData.get("moment_author_avatar_url") || ""
  ).trim();
  const authorHasProfile =
    params.formData.get("moment_author_has_profile") === "on";

  const momentTitle = String(params.formData.get("moment_title") || "").trim();
  const momentSlugRaw = String(params.formData.get("moment_slug") || "").trim();
  const momentCategory = String(params.formData.get("moment_category") || "daily").trim();
  const momentYearRaw = String(params.formData.get("moment_year") || "").trim();
  const momentDateText = String(params.formData.get("moment_date_text") || "").trim();

  const momentBody = String(params.formData.get("moment_body") || "").trim();
  const momentSummary = String(params.formData.get("moment_summary") || "").trim();
  const momentSource = String(params.formData.get("moment_source") || "").trim();

  const momentImageUrlsText = String(
    params.formData.get("moment_image_urls_text") || ""
  ).trim();

  const momentReplyLinesJson = String(
    params.formData.get("moment_reply_lines_json") || ""
  ).trim();

  const momentChoiceOptionsJson = String(
    params.formData.get("moment_choice_options_json") || ""
  ).trim();

  const momentCommentsJson = String(
    params.formData.get("moment_comments_json") || ""
  ).trim();

  const momentIsFavorite = params.formData.get("moment_is_favorite") === "on";
  const momentIsComplete = params.formData.get("moment_is_complete") === "on";

  const momentImageUrls = parseLineSeparatedUrls(momentImageUrlsText);

 const momentReplyLines = parseJsonFieldOptional<
  Array<{
    speakerKey?: string;
    speakerName?: string;
    targetName?: string;
    content?: string;
    isReplyToMc?: boolean;
  }>
>(momentReplyLinesJson, "moment_reply_lines_json", []);

const momentChoiceOptions = parseJsonFieldOptional<
  Array<{
    id?: string;
    label?: string;
    isHistory?: boolean;
    replySpeakerKey?: string;
    replySpeakerName?: string;
    replyTargetName?: string;
    replyContent?: string;
  }>
>(momentChoiceOptionsJson, "moment_choice_options_json", []);

const momentComments = parseJsonFieldOptional<
  Array<{
    speakerKey?: string;
    avatarUrl?: string;
    nickname?: string;
    content?: string;
    likeCount?: number;
  }>
>(momentCommentsJson, "moment_comments_json", []);

  const momentCategoryLabelMap: Record<string, string> = {
    daily: "일상",
    card: "카드",
    story: "스토리",
  };

  const finalSlug =
    momentSlugRaw ||
    params.rawSlug ||
    buildMomentSlug({
      authorKey,
      title: momentTitle,
      fallback: momentBody.slice(0, 30),
    });

const historyChoice = momentChoiceOptions.find((option) => {
  const optionId = String(option?.id || "").trim();
  return optionId && option.isHistory;
});

const selectedOptionId = historyChoice
  ? String(historyChoice.id || "").trim()
  : momentChoiceOptions.length > 0
    ? String(momentChoiceOptions[0]?.id || "").trim() || "option-1"
    : null;
    
  const { error } = await supabase
    .from("phone_items")
    .update({
      title: momentTitle || `${authorName || authorKey} 모멘트`,
      slug: finalSlug,
      subtype: "moment",
      release_year: momentYearRaw ? Number(momentYearRaw) : null,
      preview_text: momentSummary || momentBody.slice(0, 60),
      summary: momentSummary || momentBody.slice(0, 60),
      is_published: params.isPublished,
      content_json: {
        authorKey,
        authorName,
        authorAvatarUrl,
        authorHasProfile,
        momentCategory,
        momentCategoryLabel: momentCategoryLabelMap[momentCategory] || "일상",
        momentYear: momentYearRaw ? Number(momentYearRaw) : null,
        momentDateText,
        momentBody,
        momentSummary,
        momentSource,
        momentImageUrls,
        momentReplyLines,
        momentChoiceOptions,
        momentSelectedOptionId: selectedOptionId,
        momentComments,
        isFavorite: momentIsFavorite,
        isComplete: momentIsComplete,
      },
    })
    .eq("id", params.phoneItemId);

  if (error) throw new Error(error.message);
}

async function createCallPhoneItem(params: {
  rawSlug: string;
  title: string;
  subtype: string;
  summary: string;
  isPublished: boolean;
  formData: FormData;
}): Promise<CreatedPhoneItem> {
  const serverKey = String(params.formData.get("server_key") || "kr").trim();
  const releaseYear = new Date().getFullYear();

  const characterKey = String(params.formData.get("character_key") || "").trim();
  const characterName = String(params.formData.get("character_name") || "").trim();
  const avatarUrl = String(params.formData.get("avatar_url") || "").trim();
  const coverImage = String(params.formData.get("cover_image") || "").trim();
  const youtubeUrl = String(params.formData.get("youtube_url") || "").trim();
  const body = String(params.formData.get("body") || "").trim();
  const levelRaw = String(params.formData.get("level") || "").trim();
  const level = levelRaw ? Number(levelRaw) : null;

  const translationHtml = String(
    params.formData.get("call_translation_html") || ""
  ).trim();

  const memoHtml = String(
    params.formData.get("call_memo_html") || ""
  ).trim();

  const historySummary = String(
    params.formData.get("history_summary") || ""
  ).trim();

  const historySource = String(
    params.formData.get("history_source") || ""
  ).trim();

  const historyCategory =
    String(params.formData.get("history_category") || "").trim() || "story";

  const finalSlug =
    params.rawSlug ||
    buildPhoneItemSlug({
      subtype: params.subtype,
      characterKey,
      title: params.title,
      fallback: body.slice(0, 30),
    });

  const { serverId, characterId } = await resolveServerAndCharacterIds(
    serverKey,
    characterKey
  );

  const { data, error } = await supabase
    .from("phone_items")
    .insert({
      content_id: makeContentId(`phone-${params.subtype}`),
      origin_key: `${characterKey}-${finalSlug}`,
      server_id: serverId,
      primary_character_id: characterId,
      title: params.title || `${characterName || characterKey} 통화`,
      slug: finalSlug,
      subtype: params.subtype,
      release_year: releaseYear,
      summary: params.summary || historySummary || body.slice(0, 60),
      is_published: params.isPublished,
      embed_url: toEmbedUrl(youtubeUrl) || null,
      content_json: {
        characterKey,
        characterName,
        avatarUrl,
        level,
        coverImage,
        body,
        translationHtml,
        memoHtml,
        historyCategory,
        historyCategoryLabel:
          CALL_HISTORY_CATEGORY_LABEL_MAP[historyCategory] || "스토리",
        historySummary,
        historySource,
      },
    })
    .select("id, slug")
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    slug: data.slug,
  };
}

export async function createPhoneItemAction(formData: FormData) {
  let createdItem: { id: string; slug: string } | null = null;

  try {
    const subtype = String(formData.get("subtype") || "").trim();

    const rawSlug =
      String(formData.get("slug") || "").trim() ||
      (subtype === "article"
        ? String(formData.get("article_slug") || "").trim()
        : "");

    assertPhoneSlugAllowed(rawSlug);

    const title =
      String(formData.get("title") || "").trim() ||
      (subtype === "article"
        ? String(formData.get("article_title") || "").trim()
        : "");

    const isPublished = formData.get("is_published") === "on";
    const summary = String(formData.get("summary") || "").trim();

    if (subtype === "call" || subtype === "video_call") {
      createdItem = await createCallPhoneItem({
        rawSlug,
        title,
        subtype,
        summary,
        isPublished,
        formData,
      });
    } else if (subtype === "article") {
      createdItem = await createArticlePhoneItem({
        rawSlug,
        title,
        subtype,
        summary,
        isPublished,
        formData,
      });
    } else if (subtype === "message") {
      createdItem = await createMessagePhoneItem({
        rawSlug,
        title,
        isPublished,
        formData,
      });
    } else if (subtype === "moment") {
      createdItem = await createMomentPhoneItem({
        rawSlug,
        isPublished,
        formData,
      });
    } else {
      throw new Error("지원하지 않는 subtype입니다.");
    }

    revalidatePhoneItemPaths(createdItem.slug, createdItem.id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    redirect(`/admin/phone-items/new?error=${encodeURIComponent(message)}`);
  }

  redirect(`/admin/phone-items/${createdItem.id}/edit`);
}

export async function updatePhoneItemAction(formData: FormData) {
  const subtype = String(formData.get("subtype") || "").trim();

  const rawSlug =
    String(formData.get("slug") || "").trim() ||
    (subtype === "article"
      ? String(formData.get("article_slug") || "").trim()
      : "");

  assertPhoneSlugAllowed(rawSlug);

  const phoneItemId = String(formData.get("phoneItemId") || "").trim();

  try {
    const title =
      String(formData.get("title") || "").trim() ||
      (subtype === "article"
        ? String(formData.get("article_title") || "").trim()
        : "");
    const isPublished = formData.get("is_published") === "on";
    const summary = String(formData.get("summary") || "").trim();

    if (!phoneItemId) {
      throw new Error("phoneItemId가 없습니다.");
    }

    if (subtype === "call" || subtype === "video_call") {
      await updateCallPhoneItem({
        phoneItemId,
        rawSlug,
        title,
        subtype,
        summary,
        isPublished,
        formData,
      });
    } else if (subtype === "article") {
      await updateArticlePhoneItem({
        phoneItemId,
        rawSlug,
        title,
        subtype,
        summary,
        isPublished,
        formData,
      });
    } else if (subtype === "message") {
      await updateMessagePhoneItem({
        phoneItemId,
        rawSlug,
        title,
        isPublished,
        formData,
      });
    } else if (subtype === "moment") {
      await updateMomentPhoneItem({
        phoneItemId,
        rawSlug,
        isPublished,
        formData,
      });
    } else {
      throw new Error("지원하지 않는 subtype입니다.");
    }

    revalidatePhoneItemPaths(rawSlug, phoneItemId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    redirect(
      `/admin/phone-items/${phoneItemId}/edit?error=${encodeURIComponent(message)}`
    );
  }

  redirect("/admin/phone-items");
}

export async function deletePhoneItemAction(formData: FormData) {
  const phoneItemId = String(formData.get("phoneItemId") ?? "").trim();

  if (!phoneItemId) {
    throw new Error("phoneItemId가 없습니다.");
  }

  const { error: relationError } = await supabase
    .from("item_relations")
    .delete()
    .or(`parent_id.eq.${phoneItemId},child_id.eq.${phoneItemId}`);

  if (relationError) {
    throw new Error(`item_relations 삭제 실패: ${relationError.message}`);
  }

  const { error: translationError } = await supabase
    .from("translations")
    .delete()
    .eq("parent_type", "phone_item")
    .eq("parent_id", phoneItemId);

  if (translationError) {
    throw new Error(`translations 삭제 실패: ${translationError.message}`);
  }

  const { error: mediaError } = await supabase
    .from("media_assets")
    .delete()
    .eq("parent_type", "phone_item")
    .eq("parent_id", phoneItemId);

  if (mediaError) {
    throw new Error(`media_assets 삭제 실패: ${mediaError.message}`);
  }

  const { error: phoneItemError } = await supabase
    .from("phone_items")
    .delete()
    .eq("id", phoneItemId);

  if (phoneItemError) {
    throw new Error(`phone_items 삭제 실패: ${phoneItemError.message}`);
  }

  revalidatePath("/admin/phone-items");
  revalidatePath("/phone-items");
  redirect("/admin/phone-items");
}