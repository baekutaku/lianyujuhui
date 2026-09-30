"use server";

import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import {
  parseMessageBulk,
  parseMomentBulk,
} from "@/lib/admin/phoneBulkParsers";

const CHARACTER_LABEL_MAP: Record<string, string> = {
  baiqi: "백기",
  lizeyan: "이택언",
  zhouqiluo: "주기락",
  xumo: "허묵",
  lingxiao: "연시호",
};

const RESERVED_PHONE_SLUGS = new Set([
  "edit",
  "new",
  "calls",
  "messages",
  "moments",
  "articles",
  "me",
]);

function slugify(input: string) {
  return String(input || "")
    .trim()
    .replace(/[<>[\]{}()'"`.,!?/\\|@#$%^&*+=:;]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function makeSafePhoneSlug(rawSlug: string, fallbackTitle: string) {
  const base = slugify(rawSlug || fallbackTitle);

  if (!base) {
    return `item-${Date.now()}`;
  }

  if (RESERVED_PHONE_SLUGS.has(base)) {
    return `${base}-${Date.now()}`;
  }

  return base;
}

function toEmbedUrl(raw: string) {
  const value = raw.trim();
  if (!value) return "";

  if (value.includes("/embed/")) return value;

  const match = value.match(/[?&]v=([^&]+)/);
  if (match?.[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }

  const shortMatch = value.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return value;
}

function makeContentId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function resolveServerAndCharacterIds(
  serverKey: string,
  characterKey?: string
) {
  const { data: server } = await supabase
    .from("servers")
    .select("id")
    .eq("key", serverKey)
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


export async function createPhoneItemAction(formData: FormData) {
  const subtype = String(formData.get("subtype") || "");
  const serverKey = String(formData.get("server_key") || "kr");
  const isPublished = formData.get("is_published") === "on";
  const releaseYear = new Date().getFullYear();

if (subtype === "message") {
  const title = String(formData.get("title") || "").trim();
  const preview = String(formData.get("preview") || "").trim();
  const threadKey = String(formData.get("thread_key") || "").trim();
  const characterKey = String(formData.get("character_key") || "").trim();
  const characterName = String(formData.get("character_name") || "").trim();
  const avatarUrl = String(formData.get("avatar_url") || "").trim();
  const levelRaw = String(formData.get("level") || "").trim();
  const level = levelRaw ? Number(levelRaw) : null;

  const historySummary = String(formData.get("history_summary") || "").trim();
  const historySource = String(formData.get("history_source") || "").trim();
  const historyCategory =
    String(formData.get("history_category") || "").trim() || "daily";

  const categoryLabelMap: Record<string, string> = {
    daily: "일상",
    companion: "동반",
    card_story: "카드",
    main_story: "메인스토리",
  };

  const raw = String(formData.get("message_bulk_raw") || "");
  const entriesJson = String(formData.get("entries_json") || "").trim();
  const editorEntriesJson = String(formData.get("editor_entries_json") || "").trim();

  const entries = entriesJson ? JSON.parse(entriesJson) : parseMessageBulk(raw);
  const editorEntries = editorEntriesJson ? JSON.parse(editorEntriesJson) : entries;

  const rawSlug = String(formData.get("slug") || "").trim();

const finalSlug = makeSafePhoneSlug(
  String(formData.get("slug") || "").trim(),
  title || preview || "thread"
);

  const finalThreadKey =
    threadKey || `${characterKey || "thread"}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const { serverId, characterId } = await resolveServerAndCharacterIds(
    serverKey,
    characterKey
  );

  console.log("phone_items message insert:", {
    title: title || preview,
    slug: finalSlug,
    subtype: "message",
    threadKey: finalThreadKey,
    characterKey,
  });

  const { error } = await supabase.from("phone_items").insert({
    content_id: makeContentId("phone-message"),
    origin_key: finalThreadKey,
    server_id: serverId,
    primary_character_id: characterId,
    title: title || preview,
    slug: finalSlug,
    subtype: "message",
    release_year: releaseYear,
    preview_text: preview,
    summary: historySummary || preview,
    is_published: isPublished,
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
  redirect("/admin/phone-items");
}

  if (subtype === "moment") {
    const raw = String(formData.get("moment_bulk_raw") || "");
    const posts = parseMomentBulk(raw);

    if (posts.length === 0) {
      throw new Error("모멘트 내용이 없습니다.");
    }

    const rows = await Promise.all(
      posts.map(async (post, index) => {
        const { serverId, characterId } = await resolveServerAndCharacterIds(
          serverKey,
          post.characterKey
        );

        return {
          content_id: makeContentId("phone-moment"),
          origin_key: `${post.characterKey}-${index + 1}`,
          server_id: serverId,
          primary_character_id: characterId,
          title: `${post.authorName} 모멘트 ${index + 1}`,
          slug: `${post.characterKey}-${Date.now()}-${index + 1}`,
          subtype: "moment",
          release_year: releaseYear,
          preview_text: post.body.slice(0, 60),
          summary: post.body.slice(0, 60),
          is_published: isPublished,
          content_json: {
            characterKey: post.characterKey,
            authorName: post.authorName,
            authorAvatar: post.authorAvatar,
            authorLevel: post.authorLevel,
            body: post.body,
            quoteText: post.quoteText,
            images: post.images || [],
          },
        };
      })
    );

    const { error } = await supabase.from("phone_items").insert(rows);
    if (error) throw new Error(error.message);
    redirect("/admin/phone-items");
  }

  if (subtype === "call" || subtype === "video_call") {
    const characterKey = String(formData.get("character_key") || "").trim();
    const fallbackName = CHARACTER_LABEL_MAP[characterKey] || characterKey;
    const characterName =
      String(formData.get("character_name") || "").trim() || fallbackName;
    const title = String(formData.get("title") || "").trim();

    const rawSlug = String(formData.get("slug") || "").trim();
    const slug = makeSafePhoneSlug(rawSlug, title);

    const avatarUrl = String(formData.get("avatar_url") || "").trim();
    const coverImage = String(formData.get("cover_image") || "").trim();
    const youtubeUrl = String(formData.get("youtube_url") || "").trim();
    const body = String(formData.get("body") || "").trim();
    const levelRaw = String(formData.get("level") || "").trim();
    const level = levelRaw ? Number(levelRaw) : null;

    const { serverId, characterId } = await resolveServerAndCharacterIds(
      serverKey,
      characterKey
    );

    const { error } = await supabase.from("phone_items").insert({
      content_id: makeContentId(`phone-${subtype}`),
      origin_key: `${characterKey}-${slug}`,
      server_id: serverId,
      primary_character_id: characterId,
      title,
      slug,
      subtype,
      release_year: releaseYear,
      embed_url: toEmbedUrl(youtubeUrl),
      summary: body.slice(0, 60),
      is_published: isPublished,
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
    redirect("/admin/phone-items");
  }

  if (subtype === "article") {
    const title = String(formData.get("title") || "").trim();
    const rawSlug = String(formData.get("slug") || "").trim();
    const slug = makeSafePhoneSlug(rawSlug, title);

    const preview = String(formData.get("preview") || "").trim();
    const iconUrl = String(formData.get("icon_url") || "").trim();
    const imageUrl = String(formData.get("image_url") || "").trim();
    const sourceName = String(formData.get("source_name") || "").trim();
    const author = String(formData.get("author") || "").trim();
    const body = String(formData.get("body") || "").trim();

    const { serverId } = await resolveServerAndCharacterIds(serverKey);

    const { error } = await supabase.from("phone_items").insert({
      content_id: makeContentId("phone-article"),
      origin_key: slug,
      server_id: serverId,
      primary_character_id: null,
      title,
      slug,
      subtype: "article",
      release_year: releaseYear,
      preview_text: preview,
      summary: preview,
      is_published: isPublished,
      content_json: {
        preview,
        iconUrl,
        imageUrl,
        sourceName,
        author,
        body,
      },
    });

    if (error) throw new Error(error.message);
    redirect("/admin/phone-items");
  }

  throw new Error("지원하지 않는 subtype입니다.");
}