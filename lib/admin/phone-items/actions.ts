import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import {
  parseMessageBulk,
  parseMomentBulk,
} from "@/lib/admin/phoneBulkParsers";

function slugify(input: string) {
  return (
    input
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
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


const RESERVED_PHONE_SLUGS = new Set([
  "edit",
  "new",
  "calls",
  "messages",
  "moments",
  "articles",
  "me",
  "characters",
]);

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

function revalidatePhoneItemPaths(rawSlug: string) {
  const safeSlug = encodeURIComponent(rawSlug || "item");

  revalidatePath("/admin/phone-items");
  revalidatePath("/phone-items");
  revalidatePath(`/admin/phone-items/${safeSlug}/edit`);
}

async function createCallPhoneItem(params: {
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

  const finalSlug =
    params.rawSlug ||
    buildPhoneItemSlug({
      subtype: params.subtype,
      characterKey,
      title: params.title,
      fallback: body.slice(0, 30),
    });


    

  const { error } = await supabase.from("phone_items").insert({
    title: params.title || `${characterName || characterKey} 통화`,
    slug: finalSlug,
    subtype: params.subtype,
    summary: params.summary || body.slice(0, 60),
    is_published: params.isPublished,
    embed_url: toEmbedUrl(youtubeUrl) || null,
    content_json: {
      characterKey,
      characterName,
      avatarUrl,
      level,
      coverImage,
      body,
    },
  });

  if (error) throw new Error(error.message);
  return finalSlug;
}

async function createArticlePhoneItem(params: {
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
    buildPhoneItemSlug({
      subtype: params.subtype,
      characterKey: sourceSlug || "article",
      title: articleTitle,
      fallback: preview || body.slice(0, 30),
    });

  const { error } = await supabase.from("phone_items").insert({
    title: articleTitle,
    slug: finalSlug,
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
      comments,
    },
  });

  if (error) throw new Error(error.message);
  return finalSlug;
}

async function createMessagePhoneItem(params: {
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

  const finalThreadKey =
    threadKey ||
    params.rawSlug ||
    buildPhoneItemSlug({
      subtype: "message",
      characterKey,
      title: params.title || preview || "message",
    });

  const finalSlug = params.rawSlug || finalThreadKey;

  const { error } = await supabase.from("phone_items").insert({
    title: params.title || preview || `${characterName || characterKey} 메시지`,
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
  });

  if (error) throw new Error(error.message);
  return finalSlug;
}

async function createMomentPhoneItem(params: {
  rawSlug: string;
  isPublished: boolean;
  formData: FormData;
}) {
  const raw = String(params.formData.get("moment_bulk_raw") || "").trim();
  const posts = parseMomentBulk(raw);

  if (posts.length === 0) {
    throw new Error("모멘트 내용이 없습니다.");
  }

  const first = posts[0];

  const finalSlug =
    params.rawSlug ||
    buildPhoneItemSlug({
      subtype: "moment",
      characterKey: first.characterKey,
      title: first.authorName,
      fallback: first.body.slice(0, 30),
    });

  const { error } = await supabase.from("phone_items").insert({
    title: `${first.authorName} 모멘트`,
    slug: finalSlug,
    subtype: "moment",
    preview_text: first.body.slice(0, 60),
    summary: first.body.slice(0, 60),
    is_published: params.isPublished,
    content_json: {
      characterKey: first.characterKey,
      authorName: first.authorName,
      authorAvatar: first.authorAvatar,
      authorLevel: first.authorLevel,
      posts,
    },
  });

  if (error) throw new Error(error.message);
  return finalSlug;
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

  const { error } = await supabase
    .from("phone_items")
    .update({
      title: params.title,
      slug: params.rawSlug || null,
      subtype: params.subtype,
      summary: params.summary || body.slice(0, 60),
      is_published: params.isPublished,
      embed_url: toEmbedUrl(youtubeUrl) || null,
      content_json: {
        characterKey,
        characterName,
        avatarUrl,
        level,
        coverImage,
        body,
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
    buildPhoneItemSlug({
      subtype: params.subtype,
      characterKey: sourceSlug || "article",
      title: articleTitle,
      fallback: preview || body.slice(0, 30),
    });

  const { error } = await supabase
    .from("phone_items")
    .update({
      title: articleTitle,
      slug: finalSlug,
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

  const finalThreadKey = threadKey || params.rawSlug || "message-thread";
  const finalSlug = params.rawSlug || finalThreadKey;

  const { error } = await supabase
    .from("phone_items")
    .update({
      title: params.title || preview,
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
  const raw = String(params.formData.get("moment_bulk_raw") || "").trim();
  const posts = parseMomentBulk(raw);

  if (posts.length === 0) {
    throw new Error("모멘트 내용이 없습니다.");
  }

  const first = posts[0];

  const { error } = await supabase
    .from("phone_items")
    .update({
      title: `${first.authorName} 모멘트`,
      slug: params.rawSlug || null,
      subtype: "moment",
      preview_text: first.body.slice(0, 60),
      summary: first.body.slice(0, 60),
      is_published: params.isPublished,
      content_json: {
        characterKey: first.characterKey,
        authorName: first.authorName,
        authorAvatar: first.authorAvatar,
        authorLevel: first.authorLevel,
        posts,
      },
    })
    .eq("id", params.phoneItemId);

  if (error) throw new Error(error.message);
}

export async function createPhoneItemAction(formData: FormData) {
  let targetSlug = "";

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
      targetSlug = await createCallPhoneItem({
        rawSlug,
        title,
        subtype,
        summary,
        isPublished,
        formData,
      });
    } else if (subtype === "article") {
      targetSlug = await createArticlePhoneItem({
        rawSlug,
        title,
        subtype,
        summary,
        isPublished,
        formData,
      });
    } else if (subtype === "message") {
      targetSlug = await createMessagePhoneItem({
        rawSlug,
        title,
        isPublished,
        formData,
      });
    } else if (subtype === "moment") {
      targetSlug = await createMomentPhoneItem({
        rawSlug,
        isPublished,
        formData,
      });
    } else {
      throw new Error("지원하지 않는 subtype입니다.");
    }

    revalidatePhoneItemPaths(targetSlug);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    redirect(`/admin/phone-items/new?error=${encodeURIComponent(message)}`);
  }

  redirect(`/admin/phone-items/${encodeURIComponent(targetSlug)}/edit`);
}

export async function updatePhoneItemAction(formData: FormData) {
  const subtype = String(formData.get("subtype") || "").trim();

  const rawSlug =
    String(formData.get("slug") || "").trim() ||
    (subtype === "article"
      ? String(formData.get("article_slug") || "").trim()
      : "");

  assertPhoneSlugAllowed(rawSlug);

  const safeSlug = encodeURIComponent(rawSlug || "item");

  try {
    const phoneItemId = String(formData.get("phoneItemId") || "").trim();
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

    revalidatePhoneItemPaths(rawSlug);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    redirect(
      `/admin/phone-items/${safeSlug}/edit?error=${encodeURIComponent(message)}`
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