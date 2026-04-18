"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import { buildCardKeys, buildStoryKeys } from "@/lib/utils/admin-keys";
import {
  createPhoneItemAction,
  updatePhoneItemAction,
  deletePhoneItemAction,
} from "@/lib/admin/phone-items/actions";
import { isAdmin } from "@/lib/utils/admin-auth";

import {
  parseMessageBulk,
  parseMomentBulk,
} from "@/lib/admin/phoneBulkParsers";
import { createPasswordRecord, normalizeStoryVisibility } from "@/lib/utils/content-visibility";

function slugify(input: string) {
  return (
    input
      .normalize("NFC")
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "event"
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

function buildEventKeys(params: {
  subtype: string;
  characterKey: string;
  title: string;
  year: number;
  serverKey: string;
  startDate?: string;
}) {
  const base = slugify(params.title);
  const startDatePart = params.startDate
    ? params.startDate.replace(/-/g, "")
    : "nodate";

  return {
    slug: `${params.serverKey}-${params.year}-${params.subtype}-${params.characterKey}-${startDatePart}-${base}`,
    originKey: `event:${params.serverKey}:${params.year}:${params.subtype}:${params.characterKey}:${startDatePart}:${base}`,
    contentId: `event_${params.serverKey}_${params.year}_${params.subtype}_${params.characterKey}_${startDatePart}_${base}`,
  };
}


function extractYoutubeVideoId(url: string) {
  const value = url.trim();
  if (!value) return null;

  const embedMatch = value.match(/\/embed\/([^?&/]+)/);
  if (embedMatch?.[1]) return embedMatch[1];

  const watchMatch = value.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) return watchMatch[1];

  const shortMatch = value.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch?.[1]) return shortMatch[1];

  const shortsMatch = value.match(/youtube\.com\/shorts\/([^?&/]+)/);
  if (shortsMatch?.[1]) return shortsMatch[1];

  return null;
}

function toNullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function toNullableInt(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const num = Number(text);
  return Number.isNaN(num) ? null : num;
}

async function syncStoryCharacters(storyId: string, characterIds: string[]) {
  await supabase
    .from("item_characters")
    .delete()
    .eq("item_type", "story")
    .eq("item_id", storyId);

  if (characterIds.length === 0) return;

  const rows = characterIds.map((characterId, index) => ({
    item_type: "story",
    item_id: storyId,
    character_id: characterId,
    sort_order: index + 1,
  }));

  const { error } = await supabase.from("item_characters").insert(rows);

  if (error) {
    throw new Error(error.message);
  }
}
function slugifyTag(input: string) {
  return (
    input
      .normalize("NFC")
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "tag"
  );
}
function parseTagLabels(value: FormDataEntryValue | null) {
  const raw = String(value ?? "");

  return Array.from(
    new Set(
      raw
        .replace(/\s+#/g, "\n#")
        .split(/[,\n]/)
        .map((item) => item.trim().replace(/^#+/, ""))
        .filter(Boolean)
    )
  );
}
function parseTagLabelsFromForm(formData: FormData) {
  const raw = formData
    .getAll("tagLabels")
    .map((value) => String(value ?? ""))
    .join("\n");

  return Array.from(
    new Set(
      raw
        .replace(/\s+#/g, "\n#")
        .split(/[,\n]/)
        .map((item) => item.trim().replace(/^#+/, ""))
        .filter(Boolean)
    )
  );
}


type SyncTagKind = "story" | "event" | "card";

async function syncItemTags(params: {
  itemType: SyncTagKind;
  itemId: string;
  labels: string[];
  kind: SyncTagKind;
}) {
  const normalizedTags: Array<{
    slug: string;
    name: string;
    label: string;
    key: string;
    kind: SyncTagKind;
  }> = Array.from(
    new Map(
      params.labels
        .map((label) => label.trim())
        .filter(Boolean)
        .map((label) => {
          const slug = slugifyTag(label);

          return [
            slug,
            {
              slug,
              name: label,
              label,
              key: slug,
              kind: params.kind,
            },
          ] as const;
        })
    ).values()
  );

  const { error: deleteError } = await supabase
    .from("item_tags")
    .delete()
    .eq("item_type", params.itemType)
    .eq("item_id", params.itemId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (normalizedTags.length === 0) {
    return;
  }

  const keys = Array.from(new Set(normalizedTags.map((item) => item.key)));
  const names = Array.from(new Set(normalizedTags.map((item) => item.name)));

  const [
    { data: existingByKey, error: existingByKeyError },
    { data: existingByName, error: existingByNameError },
  ] = await Promise.all([
    supabase.from("tags").select("id, key, name").in("key", keys),
    supabase.from("tags").select("id, key, name").in("name", names),
  ]);

  if (existingByKeyError) {
    throw new Error(existingByKeyError.message);
  }

  if (existingByNameError) {
    throw new Error(existingByNameError.message);
  }

  const allExisting = [...(existingByKey ?? []), ...(existingByName ?? [])];

  const tagIdByKey = new Map<string, string>();
  const tagIdByLowerName = new Map<string, string>();

  for (const row of allExisting) {
    if (row.key) {
      tagIdByKey.set(row.key, row.id);
    }

    if (row.name) {
      tagIdByLowerName.set(String(row.name).toLowerCase(), row.id);
    }
  }

  const missingTags = normalizedTags.filter((item) => {
    return (
      !tagIdByKey.has(item.key) &&
      !tagIdByLowerName.has(item.name.toLowerCase())
    );
  });

  if (missingTags.length > 0) {
    const { data: insertedTags, error: insertError } = await supabase
      .from("tags")
      .insert(missingTags)
      .select("id, key, name");

    if (insertError) {
      throw new Error(insertError.message);
    }

    for (const row of insertedTags ?? []) {
      if (row.key) {
        tagIdByKey.set(row.key, row.id);
      }

      if (row.name) {
        tagIdByLowerName.set(String(row.name).toLowerCase(), row.id);
      }
    }
  }

  const itemTagRows = normalizedTags.flatMap((item, index) => {
    const tagId =
      tagIdByKey.get(item.key) ?? tagIdByLowerName.get(item.name.toLowerCase());

    if (!tagId) return [];

    return [
      {
        item_type: params.itemType,
        item_id: params.itemId,
        tag_id: tagId,
        sort_order: index,
      },
    ];
  });

  if (itemTagRows.length > 0) {
    const { error: insertItemTagsError } = await supabase
      .from("item_tags")
      .insert(itemTagRows);

    if (insertItemTagsError) {
      throw new Error(insertItemTagsError.message);
    }
  }
}



async function syncStoryTags(storyId: string, labels: string[]) {
  return syncItemTags({
    itemType: "story",
    itemId: storyId,
    labels,
    kind: "story",
  });
}

async function syncEventTags(eventId: string, labels: string[]) {
  return syncItemTags({
    itemType: "event",
    itemId: eventId,
    labels,
    kind: "event",
  });
}

async function syncCardTags(cardId: string, labels: string[]) {
  return syncItemTags({
    itemType: "card",
    itemId: cardId,
    labels,
    kind: "card",
  });
}
async function resolveStoryMetaFromForm(formData: FormData, currentPasswordHash?: string | null) {
  const visibility = normalizeStoryVisibility(
    String(formData.get("visibility") || "public")
  );

  const accessPassword = String(formData.get("accessPassword") || "").trim();
  const accessHint = toNullableText(formData.get("accessHint"));

  let accessPasswordHash: string | null = null;

  if (visibility === "protected") {
    if (accessPassword) {
      accessPasswordHash = createPasswordRecord(accessPassword);
    } else if (currentPasswordHash) {
      accessPasswordHash = currentPasswordHash;
    } else {
      throw new Error("비밀번호 보호 글은 비밀번호를 입력해야 합니다.");
    }
  }



  

  const appearingCharacterIds = Array.from(
    new Set(
      formData
        .getAll("appearing_character_ids")
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );

  return {
    visibility,
    accessHint: visibility === "protected" ? accessHint : null,
    accessPasswordHash,
    partNo: toNullableInt(formData.get("part_no")),
    volumeNo: toNullableInt(formData.get("volume_no")),
    mainSeason: toNullableInt(formData.get("main_season")),
    chapterNo: toNullableInt(formData.get("chapter_no")),
    mainKind: toNullableText(formData.get("main_kind")),
    routeScope: toNullableText(formData.get("route_scope")),
    primaryCharacterId: toNullableText(formData.get("primary_character_id")),
    manualSortOrder: toNullableInt(formData.get("manual_sort_order")) ?? 0,
    arcTitle: toNullableText(formData.get("arc_title")),
    episodeTitle: toNullableText(formData.get("episode_title")),
    appearingCharacterIds,
  };
}
async function requireAdmin() {
  const admin = await isAdmin();

  if (!admin) {
    throw new Error("관리자 권한이 없습니다.");
  }
}

export async function createCard(formData: FormData) {
  let targetSlug = "";

  try {
    await requireAdmin();

    const title = String(formData.get("title") || "").trim();
    const rarity = String(formData.get("rarity") || "ssr").trim();
    const attribute = String(formData.get("attribute") || "affinity").trim();
    const releaseYear = Number(formData.get("releaseYear") || 2025);
    const releaseDate = String(formData.get("releaseDate") || "").trim();
    const summary = String(formData.get("summary") || "").trim();
    const cardCategory = String(formData.get("cardCategory") || "other").trim();
    const tagLabels = parseTagLabelsFromForm(formData);
    const linkedStorySlugs = parseSlugLines(formData.get("linkedStorySlugs"));
const linkedPhoneItemSlugs = parseSlugLines(formData.get("linkedPhoneItemSlugs"));
const linkedEventSlugs = parseSlugLines(formData.get("linkedEventSlugs"));

    const serverKey = String(formData.get("serverKey") || "kr").trim();
    const characterKey = String(formData.get("characterKey") || "baiqi").trim();

    const thumbnailUrl = String(formData.get("thumbnailUrl") || "").trim();
    const thumbnailAfterUrl = String(formData.get("thumbnailAfterUrl") || "").trim();
    const coverImageUrl = String(formData.get("coverImageUrl") || "").trim();
    const coverAfterUrl = String(formData.get("coverAfterUrl") || "").trim();

    if (!title) throw new Error("title이 비어 있습니다.");
    if (!Number.isFinite(releaseYear)) throw new Error("releaseYear가 올바르지 않습니다.");

    const { slug, originKey, contentId } = buildCardKeys({
      characterKey,
      title,
      year: releaseYear,
      serverKey,
    });

    targetSlug = slug;

    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("id")
      .eq("key", serverKey)
      .single();

    if (serverError || !server) {
      throw new Error(`server 조회 실패: ${serverError?.message || serverKey}`);
    }

    const { data: character, error: characterError } = await supabase
      .from("characters")
      .select("id")
      .eq("key", characterKey)
      .single();

    if (characterError || !character) {
      throw new Error(`character 조회 실패: ${characterError?.message || characterKey}`);
    }

    const { data: insertedCard, error: cardError } = await supabase
      .from("cards")
      .insert({
        content_id: contentId,
        origin_key: originKey,
        server_id: server.id,
        primary_character_id: character.id,
        title,
        slug,
        rarity,
        attribute,
        release_year: releaseYear,
        release_date: releaseDate || null,
        thumbnail_url: thumbnailUrl || null,
        cover_image_url: coverImageUrl || null,
        summary,
        card_category: cardCategory || null,
        is_published: true,
      })
      .select("id")
      .single();

    if (cardError || !insertedCard) {
      throw new Error(cardError?.message || "cards 저장 실패");
    }

    await syncCardTags(insertedCard.id, tagLabels);
    await syncRelationsBySlugs({
  parentType: "card",
  parentId: insertedCard.id,
  childType: "story",
  relationType: "card_story",
  slugs: linkedStorySlugs,
});

await syncRelationsBySlugs({
  parentType: "card",
  parentId: insertedCard.id,
  childType: "phone_item",
  relationType: "card_phone",
  slugs: linkedPhoneItemSlugs,
});

await syncRelationsBySlugs({
  parentType: "card",
  parentId: insertedCard.id,
  childType: "event",
  relationType: "card_event",
  slugs: linkedEventSlugs,
});

    if (thumbnailAfterUrl) {
      const { error: thumbAfterError } = await supabase
        .from("media_assets")
        .insert({
          parent_type: "card",
          parent_id: insertedCard.id,
          media_type: "image",
          usage_type: "thumbnail",
          url: thumbnailAfterUrl,
          title: "evolution_after",
          is_primary: false,
          sort_order: 10,
        });

      if (thumbAfterError) throw new Error(thumbAfterError.message);
    }

    if (coverAfterUrl) {
      const { error: coverAfterError } = await supabase
        .from("media_assets")
        .insert({
          parent_type: "card",
          parent_id: insertedCard.id,
          media_type: "image",
          usage_type: "cover",
          url: coverAfterUrl,
          title: "evolution_after",
          is_primary: false,
          sort_order: 11,
        });

      if (coverAfterError) throw new Error(coverAfterError.message);
    }

    revalidatePath("/admin/cards");
    revalidatePath("/cards");
  } catch (error) {
    console.error("[createCard] fatal error:", error);
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    redirect(`/admin/cards/new?error=${encodeURIComponent(message)}`);
  }

  redirect(`/cards/${encodeURIComponent(targetSlug)}`);
}

export async function createStory(formData: FormData) {
  await requireAdmin();

  const submitIntent = String(formData.get("submitIntent") || "edit").trim();

  const title = String(formData.get("title") || "").trim();
  const subtype = String(formData.get("subtype") || "card_story").trim();
  const releaseYear = Number(formData.get("releaseYear") || 2025);
  const releaseDate = String(formData.get("releaseDate") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const serverKey = String(formData.get("serverKey") || "kr").trim();
  const characterKey = String(formData.get("characterKey") || "baiqi").trim();
  const tagLabels = parseTagLabelsFromForm(formData);



  if (!title) {
    throw new Error("title이 비어 있습니다.");
  }

  if (!Number.isFinite(releaseYear)) {
    throw new Error("releaseYear가 올바르지 않습니다.");
  }

  const { slug, originKey, contentId } = buildStoryKeys({
    subtype,
    characterKey,
    title,
    year: releaseYear,
    serverKey,
  });

  const { data: server } = await supabase
    .from("servers")
    .select("id")
    .eq("key", serverKey)
    .single();

  const { data: character } = await supabase
    .from("characters")
    .select("id")
    .eq("key", characterKey)
    .single();

  if (!server || !character) {
    throw new Error("server 또는 character를 찾을 수 없습니다.");
  }

  const { data: insertedStory, error } = await supabase
    .from("stories")
    .insert({
      content_id: contentId,
      origin_key: originKey,
      server_id: server.id,
      primary_character_id: character.id,
      title,
      slug,
      subtype,
      release_year: releaseYear,
      release_date: releaseDate || null,
      summary,
      is_published: true,
    })
    .select("id, slug")
    .single();

  if (error || !insertedStory) {
    throw new Error(error?.message || "stories 저장 실패");
  }

  await syncStoryTags(insertedStory.id, tagLabels);

  revalidatePath("/admin/stories");
  revalidatePath("/stories");

  if (submitIntent === "view") {
    redirect(`/stories/${encodeURIComponent(insertedStory.slug)}`);
  }

  redirect(`/admin/stories/${encodeURIComponent(insertedStory.slug)}/edit?saved=1`);
}

export async function createTranslation(formData: FormData) {
  const storySlug = String(formData.get("storySlug") || "");
  const title = String(formData.get("title") || "");
  const body = String(formData.get("body") || "");

  const { data: story } = await supabase
    .from("stories")
    .select("id")
    .eq("slug", storySlug)
    .single();

  if (!story) {
    throw new Error("해당 slug의 story를 찾을 수 없습니다.");
  }

  const { error } = await supabase.from("translations").insert({
    parent_type: "story",
    parent_id: story.id,
    language_code: "ko",
    translation_type: "full",
    title,
    body,
    is_primary: true,
    is_published: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/stories");
  revalidatePath("/stories");
  redirect("/admin/stories");
}

export async function createCardStoryRelation(formData: FormData) {
  const cardSlug = String(formData.get("cardSlug") || "");
  const storySlug = String(formData.get("storySlug") || "");

  const { data: card } = await supabase
    .from("cards")
    .select("id, slug")
    .eq("slug", cardSlug)
    .single();

  const { data: story } = await supabase
    .from("stories")
    .select("id, slug")
    .eq("slug", storySlug)
    .single();

  if (!card || !story) {
    throw new Error("card 또는 story를 찾을 수 없습니다.");
  }

  const { error } = await supabase.from("item_relations").insert({
    parent_type: "card",
    parent_id: card.id,
    child_type: "story",
    child_id: story.id,
    relation_type: "card_story",
    sort_order: 0,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/cards/${card.slug}`);
}

export async function updateStory(formData: FormData) {
   await requireAdmin();
  const storyId = String(formData.get("storyId") || "");
  const title = String(formData.get("title") || "");
  const subtype = String(formData.get("subtype") || "card_story");
  const releaseYear = Number(formData.get("releaseYear") || 2025);
  const releaseDate = String(formData.get("releaseDate") || "");
  const summary = String(formData.get("summary") || "");

  const { error } = await supabase
    .from("stories")
    .update({
      title,
      subtype,
      release_year: releaseYear,
      release_date: releaseDate || null,
      summary,
    })
    .eq("id", storyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/stories");
  revalidatePath("/stories");
  redirect("/admin/stories");
}

function parseSlugLines(value: FormDataEntryValue | null) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

async function deleteTypedRelations(itemType: "card" | "story" | "event" | "phone_item", itemId: string) {
  const { error: parentError } = await supabase
    .from("item_relations")
    .delete()
    .eq("parent_type", itemType)
    .eq("parent_id", itemId);

  if (parentError) {
    throw new Error(`item_relations(parent) 삭제 실패: ${parentError.message}`);
  }

  const { error: childError } = await supabase
    .from("item_relations")
    .delete()
    .eq("child_type", itemType)
    .eq("child_id", itemId);

  if (childError) {
    throw new Error(`item_relations(child) 삭제 실패: ${childError.message}`);
  }
}

async function deleteCommonItemChildren(params: {
  itemType: "card" | "story" | "event" | "phone_item";
  itemId: string;
  deleteTranslations?: boolean;
  deleteMedia?: boolean;
  deleteTags?: boolean;
  deleteCharacters?: boolean;
}) {
  const {
    itemType,
    itemId,
    deleteTranslations = true,
    deleteMedia = true,
    deleteTags = true,
    deleteCharacters = true,
  } = params;

  if (deleteTags) {
    const { error: tagError } = await supabase
      .from("item_tags")
      .delete()
      .eq("item_type", itemType)
      .eq("item_id", itemId);

    if (tagError) {
      throw new Error(`item_tags 삭제 실패: ${tagError.message}`);
    }
  }

  if (deleteCharacters) {
    const { error: charError } = await supabase
      .from("item_characters")
      .delete()
      .eq("item_type", itemType)
      .eq("item_id", itemId);

    if (charError) {
      throw new Error(`item_characters 삭제 실패: ${charError.message}`);
    }
  }

  if (deleteTranslations) {
    const { error: translationError } = await supabase
      .from("translations")
      .delete()
      .eq("parent_type", itemType)
      .eq("parent_id", itemId);

    if (translationError) {
      throw new Error(`translations 삭제 실패: ${translationError.message}`);
    }
  }

  if (deleteMedia) {
    const { error: mediaError } = await supabase
      .from("media_assets")
      .delete()
      .eq("parent_type", itemType)
      .eq("parent_id", itemId);

    if (mediaError) {
      throw new Error(`media_assets 삭제 실패: ${mediaError.message}`);
    }
  }
}

function getTableNameByItemType(type: string) {
  if (type === "card") return "cards";
  if (type === "story") return "stories";
  if (type === "event") return "events";
  if (type === "phone_item") return "phone_items";
  throw new Error(`지원하지 않는 item type: ${type}`);
}

async function syncRelationsBySlugs(params: {
  parentType: "card" | "story" | "event" | "phone_item";
  parentId: string;
  childType: "card" | "story" | "event" | "phone_item";
  relationType: string;
  slugs: string[];
}) {
  const childTable = getTableNameByItemType(params.childType);

  const uniqueSlugs = Array.from(new Set(params.slugs));

  const { data: existingRelations, error: existingRelationsError } = await supabase
    .from("item_relations")
    .select("id")
    .eq("parent_type", params.parentType)
    .eq("parent_id", params.parentId)
    .eq("child_type", params.childType)
    .eq("relation_type", params.relationType);

  if (existingRelationsError) {
    throw new Error(existingRelationsError.message);
  }

  if (existingRelations && existingRelations.length > 0) {
    const relationIds = existingRelations.map((item) => item.id);

    const { error: deleteError } = await supabase
      .from("item_relations")
      .delete()
      .in("id", relationIds);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }

  if (uniqueSlugs.length === 0) {
    return;
  }

  const { data: children, error: childLookupError } = await supabase
    .from(childTable)
    .select("id, slug")
    .in("slug", uniqueSlugs);

  if (childLookupError) {
    throw new Error(childLookupError.message);
  }

  const foundChildren = children ?? [];
  const foundSlugSet = new Set(foundChildren.map((item) => item.slug));
  const missingSlugs = uniqueSlugs.filter((slug) => !foundSlugSet.has(slug));

  if (missingSlugs.length > 0) {
    throw new Error(
      `${params.childType} slug를 찾을 수 없습니다:\n${missingSlugs.join("\n")}`
    );
  }

  const rows = foundChildren.map((child, index) => ({
    parent_type: params.parentType,
    parent_id: params.parentId,
    child_type: params.childType,
    child_id: child.id,
    relation_type: params.relationType,
    sort_order: index,
  }));

  const { error: insertError } = await supabase
    .from("item_relations")
    .insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }
}
async function syncIncomingRelationsBySlugs(params: {
  childType: "card" | "story" | "event" | "phone_item";
  childId: string;
  parentType: "card" | "story" | "event" | "phone_item";
  relationType: string;
  slugs: string[];
}) {
  const parentTable = getTableNameByItemType(params.parentType);
  const uniqueSlugs = Array.from(new Set(params.slugs));

  const { data: existingRelations, error: existingRelationsError } = await supabase
    .from("item_relations")
    .select("id")
    .eq("child_type", params.childType)
    .eq("child_id", params.childId)
    .eq("parent_type", params.parentType)
    .eq("relation_type", params.relationType);

  if (existingRelationsError) {
    throw new Error(existingRelationsError.message);
  }

  if (existingRelations && existingRelations.length > 0) {
    const relationIds = existingRelations.map((item) => item.id);

    const { error: deleteError } = await supabase
      .from("item_relations")
      .delete()
      .in("id", relationIds);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }

  if (uniqueSlugs.length === 0) {
    return;
  }

  const { data: parents, error: parentLookupError } = await supabase
    .from(parentTable)
    .select("id, slug")
    .in("slug", uniqueSlugs);

  if (parentLookupError) {
    throw new Error(parentLookupError.message);
  }

  const foundParents = parents ?? [];
  const foundSlugSet = new Set(foundParents.map((item) => item.slug));
  const missingSlugs = uniqueSlugs.filter((slug) => !foundSlugSet.has(slug));

  if (missingSlugs.length > 0) {
    throw new Error(
      `${params.parentType} slug를 찾을 수 없습니다:\n${missingSlugs.join("\n")}`
    );
  }

  const rows = foundParents.map((parent, index) => ({
    parent_type: params.parentType,
    parent_id: parent.id,
    child_type: params.childType,
    child_id: params.childId,
    relation_type: params.relationType,
    sort_order: index,
  }));

  const { error: insertError } = await supabase
    .from("item_relations")
    .insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function updateCard(formData: FormData) {
  const rawSlug = String(formData.get("slug") || "").trim();
  const safeSlug = encodeURIComponent(rawSlug);

  try {
    await requireAdmin();

    const cardId = String(formData.get("cardId") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const rarity = String(formData.get("rarity") || "ssr").trim();
    const attribute = String(formData.get("attribute") || "affinity").trim();
    const releaseYear = Number(formData.get("releaseYear") || 2025);
    const releaseDate = String(formData.get("releaseDate") || "").trim();
    const thumbnailUrl = String(formData.get("thumbnailUrl") || "").trim();
    const thumbnailAfterUrl = String(formData.get("thumbnailAfterUrl") || "").trim();
    const coverImageUrl = String(formData.get("coverImageUrl") || "").trim();
    const coverAfterUrl = String(formData.get("coverAfterUrl") || "").trim();
    const summary = String(formData.get("summary") || "").trim();
    const cardCategory = String(formData.get("cardCategory") || "other").trim();
    const tagLabels = parseTagLabelsFromForm(formData);

    const linkedStorySlugs = parseSlugLines(formData.get("linkedStorySlugs"));
    const linkedPhoneItemSlugs = parseSlugLines(formData.get("linkedPhoneItemSlugs"));
    const linkedEventSlugs = parseSlugLines(formData.get("linkedEventSlugs"));

    if (!cardId) {
      throw new Error("cardId가 없습니다.");
    }

    const { error } = await supabase
      .from("cards")
      .update({
        title,
        rarity,
        attribute,
        release_year: releaseYear,
        release_date: releaseDate || null,
        thumbnail_url: thumbnailUrl || null,
        cover_image_url: coverImageUrl || null,
        summary,
        card_category: cardCategory || null,
      })
      .eq("id", cardId);

    if (error) {
      throw new Error(error.message);
    }

    await syncCardTags(cardId, tagLabels);

    const { data: existingThumbAfter } = await supabase
      .from("media_assets")
      .select("id")
      .eq("parent_type", "card")
      .eq("parent_id", cardId)
      .eq("media_type", "image")
      .eq("usage_type", "thumbnail")
      .eq("title", "evolution_after")
      .maybeSingle();

    if (existingThumbAfter?.id && thumbnailAfterUrl) {
      const { error: thumbUpdateError } = await supabase
        .from("media_assets")
        .update({ url: thumbnailAfterUrl })
        .eq("id", existingThumbAfter.id);

      if (thumbUpdateError) throw new Error(thumbUpdateError.message);
    } else if (!existingThumbAfter?.id && thumbnailAfterUrl) {
      const { error: thumbInsertError } = await supabase
        .from("media_assets")
        .insert({
          parent_type: "card",
          parent_id: cardId,
          media_type: "image",
          usage_type: "thumbnail",
          url: thumbnailAfterUrl,
          title: "evolution_after",
          is_primary: false,
          sort_order: 10,
        });

      if (thumbInsertError) throw new Error(thumbInsertError.message);
    } else if (existingThumbAfter?.id && !thumbnailAfterUrl) {
      const { error: thumbDeleteError } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", existingThumbAfter.id);

      if (thumbDeleteError) throw new Error(thumbDeleteError.message);
    }

    const { data: existingCoverAfter } = await supabase
      .from("media_assets")
      .select("id")
      .eq("parent_type", "card")
      .eq("parent_id", cardId)
      .eq("media_type", "image")
      .eq("usage_type", "cover")
      .eq("title", "evolution_after")
      .maybeSingle();

    if (existingCoverAfter?.id && coverAfterUrl) {
      const { error: coverUpdateError } = await supabase
        .from("media_assets")
        .update({ url: coverAfterUrl })
        .eq("id", existingCoverAfter.id);

      if (coverUpdateError) throw new Error(coverUpdateError.message);
    } else if (!existingCoverAfter?.id && coverAfterUrl) {
      const { error: coverInsertError } = await supabase
        .from("media_assets")
        .insert({
          parent_type: "card",
          parent_id: cardId,
          media_type: "image",
          usage_type: "cover",
          url: coverAfterUrl,
          title: "evolution_after",
          is_primary: false,
          sort_order: 11,
        });

      if (coverInsertError) throw new Error(coverInsertError.message);
    } else if (existingCoverAfter?.id && !coverAfterUrl) {
      const { error: coverDeleteError } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", existingCoverAfter.id);

      if (coverDeleteError) throw new Error(coverDeleteError.message);
    }

    console.log("[updateCard] linkedStorySlugs", linkedStorySlugs);
console.log("[updateCard] linkedPhoneItemSlugs", linkedPhoneItemSlugs);
console.log("[updateCard] linkedEventSlugs", linkedEventSlugs);


    // await syncRelationsBySlugs({
    //   parentType: "card",
    //   parentId: cardId,
    //   childType: "story",
    //   relationType: "card_story",
    //   slugs: linkedStorySlugs,
    // });

    // await syncRelationsBySlugs({
    //   parentType: "card",
    //   parentId: cardId,
    //   childType: "phone_item",
    //   relationType: "card_phone",
    //   slugs: linkedPhoneItemSlugs,
    // });

    // await syncRelationsBySlugs({
    //   parentType: "card",
    //   parentId: cardId,
    //   childType: "event",
    //   relationType: "card_event",
    //   slugs: linkedEventSlugs,
    // });

    revalidatePath("/admin/cards");
    revalidatePath("/cards");
    revalidatePath(`/cards/${rawSlug}`);
  } catch (error) {
    console.error("[updateCard] fatal error:", error);

    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    redirect(`/admin/cards/${safeSlug}/edit?error=${encodeURIComponent(message)}`);
  }

  redirect(`/admin/cards/${safeSlug}/edit?saved=1`);
}
export async function updateTranslation(formData: FormData) {
  const translationId = String(formData.get("translationId") || "");
  const title = String(formData.get("title") || "");
  const body = String(formData.get("body") || "");

  const { error } = await supabase
    .from("translations")
    .update({
      title,
      body,
    })
    .eq("id", translationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/stories");
  revalidatePath("/stories");
  redirect("/admin/stories");
}
const ALLOWED_STORY_SUBTYPES = new Set([
  "card_story",
  "main_story",
  "side_story",
  "asmr",
  "behind_story",
  "xiyue_story",
  "myhome_story",
  "company_project",
]);

export async function createStoryBundle(formData: FormData) {
  let successSlug = "";
  let errorRedirectUrl: string | null = null;
  const submitIntent = String(formData.get("submitIntent") || "edit").trim();

  try {
    await requireAdmin();

    const title = String(formData.get("title") || "").trim();
    const subtype = String(formData.get("subtype") || "card_story").trim();

    if (!ALLOWED_STORY_SUBTYPES.has(subtype)) {
      throw new Error(`지원하지 않는 스토리 카테고리: ${subtype}`);
    }

    const releaseYear = Number(formData.get("releaseYear") || 2025);
    const releaseDate = String(formData.get("releaseDate") || "").trim();
    const tagLabels = parseTagLabelsFromForm(formData);
    const serverKey = String(formData.get("serverKey") || "kr").trim();
    const characterKey = String(formData.get("characterKey") || "baiqi").trim();

    const translationTitleCn = String(formData.get("translationTitleCn") || "");
    const translationBodyCn = String(formData.get("translationBodyCn") || "");
    const translationTitleKr = String(formData.get("translationTitleKr") || "");
    const translationBodyKr = String(formData.get("translationBodyKr") || "");

    const youtubeUrlCn = String(formData.get("youtubeUrlCn") || "").trim();
    const youtubeUrlKr = String(formData.get("youtubeUrlKr") || "").trim();
    const coverImageUrl = String(formData.get("coverImageUrl") || "").trim();

    const linkedCardSlugs = parseSlugLines(formData.get("linkedCardSlugs"));
    const linkedPhoneItemSlugs = parseSlugLines(formData.get("linkedPhoneItemSlugs"));
    const linkedEventSlugs = parseSlugLines(formData.get("linkedEventSlugs"));

    const meta = await resolveStoryMetaFromForm(formData);

    const { slug, originKey, contentId } = buildStoryKeys({
      subtype,
      characterKey,
      title,
      year: releaseYear,
      serverKey,
    });

    successSlug = slug;

    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("id")
      .eq("key", serverKey)
      .single();

    if (serverError || !server) {
      throw new Error(`server 조회 실패: ${serverError?.message || serverKey}`);
    }

    const { data: character, error: characterError } = await supabase
      .from("characters")
      .select("id")
      .eq("key", characterKey)
      .single();

    if (characterError || !character) {
      throw new Error(`character 조회 실패: ${characterError?.message || characterKey}`);
    }

    const primaryCharacterId = meta.primaryCharacterId ?? character.id;

    const { data: insertedStory, error: storyError } = await supabase
      .from("stories")
      .insert({
        content_id: contentId,
        origin_key: originKey,
        server_id: server.id,
        primary_character_id: primaryCharacterId,
        title,
        slug,
        subtype,
        release_year: releaseYear,
        release_date: releaseDate || null,
        visibility: meta.visibility,
        access_password_hash: meta.accessPasswordHash,
        access_hint: meta.accessHint,
        part_no: meta.partNo,
        volume_no: meta.volumeNo,
        main_season: meta.mainSeason,
        chapter_no: meta.chapterNo,
        main_kind: meta.mainKind,
        route_scope: meta.routeScope,
        manual_sort_order: meta.manualSortOrder,
        arc_title: meta.arcTitle,
        episode_title: meta.episodeTitle,
        is_published: true,
      })
      .select("id, slug")
      .single();

    if (storyError || !insertedStory) {
      throw new Error(storyError?.message || "스토리 저장 실패");
    }

    await syncStoryCharacters(insertedStory.id, meta.appearingCharacterIds);
    await syncStoryTags(insertedStory.id, tagLabels);

    const hasCn = translationTitleCn.trim() || translationBodyCn.trim();
    const hasKr = translationTitleKr.trim() || translationBodyKr.trim();

    await upsertStoryTranslation({
      storyId: insertedStory.id,
      languageCode: "zh-CN",
      title: translationTitleCn,
      body: translationBodyCn,
      isPrimary: Boolean(hasCn),
    });

    await upsertStoryTranslation({
      storyId: insertedStory.id,
      languageCode: "ko",
      title: translationTitleKr,
      body: translationBodyKr,
      isPrimary: !hasCn && Boolean(hasKr),
    });

    if (coverImageUrl) {
      const { error: imageError } = await supabase
        .from("media_assets")
        .insert({
          parent_type: "story",
          parent_id: insertedStory.id,
          media_type: "image",
          usage_type: "cover",
          url: coverImageUrl,
          title: `${title} 대표 이미지`,
          is_primary: true,
          sort_order: 0,
        });

      if (imageError) {
        throw new Error(imageError.message);
      }
    }

    await upsertStoryYoutubeMedia({
      storyId: insertedStory.id,
      title: `${title} PV CN`,
      usageType: "pv_cn",
      url: youtubeUrlCn,
      isPrimary: !coverImageUrl,
      sortOrder: coverImageUrl ? 1 : 0,
    });

    await upsertStoryYoutubeMedia({
      storyId: insertedStory.id,
      title: `${title} PV KR`,
      usageType: "pv_kr",
      url: youtubeUrlKr,
      isPrimary: false,
      sortOrder: coverImageUrl ? 2 : 1,
    });

    await syncIncomingRelationsBySlugs({
      childType: "story",
      childId: insertedStory.id,
      parentType: "card",
      relationType: "card_story",
      slugs: linkedCardSlugs,
    });

    await syncIncomingRelationsBySlugs({
      childType: "story",
      childId: insertedStory.id,
      parentType: "phone_item",
      relationType: "phone_story",
      slugs: linkedPhoneItemSlugs,
    });

    await syncIncomingRelationsBySlugs({
      childType: "story",
      childId: insertedStory.id,
      parentType: "event",
      relationType: "event_story",
      slugs: linkedEventSlugs,
    });

    revalidatePath("/admin/stories");
    revalidatePath("/stories");
    revalidatePath(`/stories/${insertedStory.slug}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    errorRedirectUrl = `/admin/stories/new?error=${encodeURIComponent(message)}`;
  }

if (errorRedirectUrl) {
  redirect(errorRedirectUrl);
}

redirect(`/stories/${encodeURIComponent(successSlug)}`);
}
export async function updateStoryBundle(formData: FormData) {
  const rawSlug = String(formData.get("slug") || "").trim();
  const safeSlug = encodeURIComponent(rawSlug);

  try {
    await requireAdmin();

    const storyId = String(formData.get("storyId") || "").trim();

    if (!storyId) {
      throw new Error("storyId가 없습니다.");
    }

    const title = String(formData.get("title") || "").trim();
    const subtype = String(formData.get("subtype") || "card_story").trim();
    const releaseYear = Number(formData.get("releaseYear") || 2025);
    const releaseDate = String(formData.get("releaseDate") || "").trim();
    const tagLabels = parseTagLabelsFromForm(formData);

    const translationCnId = String(formData.get("translationCnId") || "").trim();
    const translationKrId = String(formData.get("translationKrId") || "").trim();

    const translationTitleCn = String(formData.get("translationTitleCn") || "");
    const translationBodyCn = String(formData.get("translationBodyCn") || "");
    const translationTitleKr = String(formData.get("translationTitleKr") || "");
    const translationBodyKr = String(formData.get("translationBodyKr") || "");

    const mediaCnId = String(formData.get("mediaCnId") || "").trim();
    const mediaKrId = String(formData.get("mediaKrId") || "").trim();

    const youtubeUrlCn = String(formData.get("youtubeUrlCn") || "").trim();
    const youtubeUrlKr = String(formData.get("youtubeUrlKr") || "").trim();

    const coverMediaId = String(formData.get("coverMediaId") || "").trim();
    const coverImageUrl = String(formData.get("coverImageUrl") || "").trim();

    const linkedCardSlugs = parseSlugLines(formData.get("linkedCardSlugs"));
    const linkedPhoneItemSlugs = parseSlugLines(formData.get("linkedPhoneItemSlugs"));
    const linkedEventSlugs = parseSlugLines(formData.get("linkedEventSlugs"));

    const { data: currentStory, error: currentStoryError } = await supabase
      .from("stories")
      .select("access_password_hash")
      .eq("id", storyId)
      .single();

    if (currentStoryError) {
      throw new Error(currentStoryError.message);
    }

    const meta = await resolveStoryMetaFromForm(
      formData,
      currentStory?.access_password_hash ?? null
    );

    const { error: storyError } = await supabase
      .from("stories")
      .update({
        title,
        subtype,
        release_year: releaseYear,
        release_date: releaseDate || null,
        visibility: meta.visibility,
        access_password_hash: meta.accessPasswordHash,
        access_hint: meta.accessHint,
        part_no: meta.partNo,
        volume_no: meta.volumeNo,
        main_season: meta.mainSeason,
        chapter_no: meta.chapterNo,
        main_kind: meta.mainKind,
        route_scope: meta.routeScope,
        primary_character_id: meta.primaryCharacterId,
        manual_sort_order: meta.manualSortOrder,
        arc_title: meta.arcTitle,
        episode_title: meta.episodeTitle,
      })
      .eq("id", storyId);

    if (storyError) {
      throw new Error(storyError.message);
    }

    await syncStoryCharacters(storyId, meta.appearingCharacterIds);

    const hasCn = translationTitleCn.trim() || translationBodyCn.trim();
    const hasKr = translationTitleKr.trim() || translationBodyKr.trim();

    await upsertStoryTranslation({
      translationId: translationCnId || undefined,
      storyId,
      languageCode: "zh-CN",
      title: translationTitleCn,
      body: translationBodyCn,
      isPrimary: Boolean(hasCn),
    });

    await upsertStoryTranslation({
      translationId: translationKrId || undefined,
      storyId,
      languageCode: "ko",
      title: translationTitleKr,
      body: translationBodyKr,
      isPrimary: !hasCn && Boolean(hasKr),
    });

    await syncStoryTags(storyId, tagLabels);

    await upsertStoryYoutubeMedia({
      mediaId: mediaCnId || undefined,
      storyId,
      title: `${title} PV CN`,
      usageType: "pv_cn",
      url: youtubeUrlCn,
      isPrimary: !coverImageUrl,
      sortOrder: coverImageUrl ? 1 : 0,
    });

    await upsertStoryYoutubeMedia({
      mediaId: mediaKrId || undefined,
      storyId,
      title: `${title} PV KR`,
      usageType: "pv_kr",
      url: youtubeUrlKr,
      isPrimary: false,
      sortOrder: coverImageUrl ? 2 : 1,
    });

    if (coverMediaId) {
      if (coverImageUrl) {
        const { error } = await supabase
          .from("media_assets")
          .update({
            url: coverImageUrl,
            usage_type: "cover",
            media_type: "image",
            title: `${title} 대표 이미지`,
          })
          .eq("id", coverMediaId);

        if (error) {
          throw new Error(error.message);
        }
      } else {
        const { error } = await supabase
          .from("media_assets")
          .delete()
          .eq("id", coverMediaId);

        if (error) {
          throw new Error(error.message);
        }
      }
    } else if (coverImageUrl) {
      const { error } = await supabase.from("media_assets").insert({
        parent_type: "story",
        parent_id: storyId,
        media_type: "image",
        usage_type: "cover",
        url: coverImageUrl,
        title: `${title} 대표 이미지`,
        is_primary: true,
        sort_order: 0,
      });

      if (error) {
        throw new Error(error.message);
      }
    }

    await syncIncomingRelationsBySlugs({
      childType: "story",
      childId: storyId,
      parentType: "card",
      relationType: "card_story",
      slugs: linkedCardSlugs,
    });

    await syncIncomingRelationsBySlugs({
      childType: "story",
      childId: storyId,
      parentType: "phone_item",
      relationType: "phone_story",
      slugs: linkedPhoneItemSlugs,
    });

    await syncIncomingRelationsBySlugs({
      childType: "story",
      childId: storyId,
      parentType: "event",
      relationType: "event_story",
      slugs: linkedEventSlugs,
    });

    revalidatePath("/admin/stories");
    revalidatePath("/stories");
    revalidatePath(`/stories/${rawSlug}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    redirect(`/admin/stories/${safeSlug}/edit?error=${encodeURIComponent(message)}`);
  }

  redirect(`/stories/${safeSlug}`);
}
export async function deleteStoryBundle(formData: FormData) {
  await requireAdmin();

  const storyId = String(formData.get("storyId") ?? "").trim();

  if (!storyId) {
    throw new Error("storyId가 없습니다.");
  }

  await deleteTypedRelations("story", storyId);

  await deleteCommonItemChildren({
    itemType: "story",
    itemId: storyId,
    deleteTranslations: true,
    deleteMedia: true,
    deleteTags: true,
    deleteCharacters: true,
  });

  const { error: storyError } = await supabase
    .from("stories")
    .delete()
    .eq("id", storyId);

  if (storyError) {
    throw new Error(`stories 삭제 실패: ${storyError.message}`);
  }

  revalidatePath("/admin/stories");
  revalidatePath("/stories");
  redirect("/admin/stories");
}

export async function createEventBundle(formData: FormData) {
  let createdEventId: string | null = null;
  let targetSlug = "";
  const submitIntent = String(formData.get("submitIntent") || "edit").trim();

  try {
    await requireAdmin();

    const title = String(formData.get("title") || "").trim();
    const subtype = String(formData.get("subtype") || "game_event").trim();
    const releaseYear = Number(formData.get("releaseYear") || 2025);
    const startDate = String(formData.get("startDate") || "").trim();
    const endDate = String(formData.get("endDate") || "").trim();
    const summary = String(formData.get("summary") || "").trim();
    const serverKey = String(formData.get("serverKey") || "kr").trim();
    const characterKey = String(formData.get("characterKey") || "baiqi").trim();

    const translationTitle = String(formData.get("translationTitle") || "").trim();
    const translationBody = String(formData.get("translationBody") || "").trim();

    const youtubeUrl = String(formData.get("youtubeUrl") || "").trim();
    const thumbnailUrl = String(formData.get("thumbnailUrl") || "").trim();

    const linkedCardSlugs = parseSlugLines(formData.get("linkedCardSlugs"));
    const linkedStorySlugs = parseSlugLines(formData.get("linkedStorySlugs"));
    const linkedPhoneItemSlugs = parseSlugLines(formData.get("linkedPhoneItemSlugs"));

    const tagLabels = parseTagLabelsFromForm(formData);
    const meta = await resolveStoryMetaFromForm(formData);

    if (!title) {
      throw new Error("title이 비어 있습니다.");
    }

    if (!Number.isFinite(releaseYear)) {
      throw new Error("releaseYear가 올바르지 않습니다.");
    }

    const { slug, originKey, contentId } = buildEventKeys({
      subtype,
      characterKey,
      title,
      year: releaseYear,
      serverKey,
      startDate,
    });

    targetSlug = slug;

    const { data: existingEvent } = await supabase
      .from("events")
      .select("id, slug")
      .eq("content_id", contentId)
      .maybeSingle();

    if (existingEvent) {
      redirect(
        `/admin/events/${encodeURIComponent(existingEvent.slug)}/edit?error=${encodeURIComponent(
          "이미 등록된 이벤트입니다."
        )}`
      );
    }

    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("id")
      .eq("key", serverKey)
      .single();

    if (serverError || !server) {
      throw new Error(`server 조회 실패: ${serverError?.message || serverKey}`);
    }

    const { data: character, error: characterError } = await supabase
      .from("characters")
      .select("id")
      .eq("key", characterKey)
      .single();

    if (characterError || !character) {
      throw new Error(`character 조회 실패: ${characterError?.message || characterKey}`);
    }

    const { data: insertedEvent, error: eventError } = await supabase
      .from("events")
      .insert({
        content_id: contentId,
        origin_key: originKey,
        server_id: server.id,
        primary_character_id: character.id,
        title,
        slug,
        subtype,
        release_year: releaseYear,
        start_date: startDate || null,
        end_date: endDate || null,
        thumbnail_url: thumbnailUrl || null,
        summary,
        visibility: meta.visibility,
        access_password_hash: meta.accessPasswordHash,
        access_hint: meta.accessHint,
        is_published: true,
      })
      .select("id")
      .single();

    if (eventError || !insertedEvent) {
      throw new Error(eventError?.message || "events 저장 실패");
    }

    createdEventId = insertedEvent.id;

    await syncEventTags(insertedEvent.id, tagLabels);

    if (translationBody) {
      const { error: translationError } = await supabase
        .from("translations")
        .insert({
          parent_type: "event",
          parent_id: insertedEvent.id,
          language_code: "ko",
          translation_type: "full",
          title: translationTitle || null,
          body: translationBody,
          is_primary: true,
          is_published: true,
        });

      if (translationError) {
        throw new Error(`translations 저장 실패: ${translationError.message}`);
      }
    }

    if (thumbnailUrl) {
      const { error: imageError } = await supabase
        .from("media_assets")
        .insert({
          parent_type: "event",
          parent_id: insertedEvent.id,
          media_type: "image",
          usage_type: "thumbnail",
          url: thumbnailUrl,
          title: `${title} 썸네일`,
          is_primary: !youtubeUrl,
          sort_order: youtubeUrl ? 1 : 0,
        });

      if (imageError) {
        throw new Error(`thumbnail 이미지 저장 실패: ${imageError.message}`);
      }
    }

    if (youtubeUrl) {
      const youtubeVideoId = extractYoutubeVideoId(youtubeUrl);

      const { error: mediaError } = await supabase
        .from("media_assets")
        .insert({
          parent_type: "event",
          parent_id: insertedEvent.id,
          media_type: "youtube",
          usage_type: "pv",
          url: youtubeUrl,
          youtube_video_id: youtubeVideoId,
          title: `${title} PV`,
          is_primary: true,
          sort_order: 0,
        });

      if (mediaError) {
        throw new Error(`youtube 저장 실패: ${mediaError.message}`);
      }
    }

    await syncIncomingRelationsBySlugs({
      childType: "event",
      childId: insertedEvent.id,
      parentType: "card",
      relationType: "card_event",
      slugs: linkedCardSlugs,
    });

    await syncIncomingRelationsBySlugs({
      childType: "event",
      childId: insertedEvent.id,
      parentType: "story",
      relationType: "story_event",
      slugs: linkedStorySlugs,
    });

    await syncIncomingRelationsBySlugs({
      childType: "event",
      childId: insertedEvent.id,
      parentType: "phone_item",
      relationType: "phone_event",
      slugs: linkedPhoneItemSlugs,
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    revalidatePath(`/events/${encodeURIComponent(targetSlug)}`);
  } catch (error) {
    console.error("[createEventBundle] fatal error:", error);

    if (createdEventId) {
      console.error(
        "[createEventBundle] 부분 저장됨. event id:",
        createdEventId,
        "slug:",
        targetSlug
      );
    }

    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    redirect(`/admin/events/new?error=${encodeURIComponent(message)}`);
  }

  if (submitIntent === "view") {
    redirect(`/events/${encodeURIComponent(targetSlug)}`);
  }

  redirect(`/admin/events/${encodeURIComponent(targetSlug)}/edit?saved=1`);
}

export async function updateEventBundle(formData: FormData) {
  const eventId = String(formData.get("eventId") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const safeSlug = encodeURIComponent(slug);
  const submitIntent = String(formData.get("submitIntent") || "edit").trim();

  try {
    await requireAdmin();

    const title = String(formData.get("title") || "").trim();
    const subtype = String(formData.get("subtype") || "game_event").trim();
    const releaseYear = Number(formData.get("releaseYear") || 2025);
    const startDate = String(formData.get("startDate") || "").trim();
    const endDate = String(formData.get("endDate") || "").trim();
    const summary = String(formData.get("summary") || "").trim();
    const serverKey = String(formData.get("serverKey") || "kr").trim();
    const characterKey = String(formData.get("characterKey") || "baiqi").trim();

    const translationId = String(formData.get("translationId") || "").trim();
    const translationTitle = String(formData.get("translationTitle") || "").trim();
    const translationBody = String(formData.get("translationBody") || "").trim();

    const youtubeUrl = String(formData.get("youtubeUrl") || "").trim();
    const thumbnailUrl = String(formData.get("thumbnailUrl") || "").trim();
    const isPublished = String(formData.get("isPublished") || "true").trim() === "true";

    const linkedCardSlugs = parseSlugLines(formData.get("linkedCardSlugs"));
    const linkedStorySlugs = parseSlugLines(formData.get("linkedStorySlugs"));
    const linkedPhoneItemSlugs = parseSlugLines(formData.get("linkedPhoneItemSlugs"));

    const tagLabels = parseTagLabelsFromForm(formData);

    if (!eventId) {
      throw new Error("eventId가 없습니다.");
    }

    const { data: currentEvent, error: currentEventError } = await supabase
      .from("events")
      .select("access_password_hash")
      .eq("id", eventId)
      .single();

    if (currentEventError) {
      throw new Error(currentEventError.message);
    }

    const meta = await resolveStoryMetaFromForm(
      formData,
      currentEvent?.access_password_hash ?? null
    );

    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("id")
      .eq("key", serverKey)
      .single();

    if (serverError || !server) {
      throw new Error(`server 조회 실패: ${serverError?.message || serverKey}`);
    }

    const { data: character, error: characterError } = await supabase
      .from("characters")
      .select("id")
      .eq("key", characterKey)
      .single();

    if (characterError || !character) {
      throw new Error(`character 조회 실패: ${characterError?.message || characterKey}`);
    }

    const { error: eventError } = await supabase
      .from("events")
      .update({
        title,
        subtype,
        release_year: releaseYear,
        start_date: startDate || null,
        end_date: endDate || null,
        summary,
        server_id: server.id,
        primary_character_id: character.id,
        thumbnail_url: thumbnailUrl || null,
        visibility: meta.visibility,
        access_password_hash: meta.accessPasswordHash,
        access_hint: meta.accessHint,
        is_published: isPublished,
      })
      .eq("id", eventId);

    if (eventError) {
      throw new Error(eventError.message);
    }

    await syncEventTags(eventId, tagLabels);

    if (translationId) {
      const { error: translationError } = await supabase
        .from("translations")
        .update({
          title: translationTitle || null,
          body: translationBody,
        })
        .eq("id", translationId);

      if (translationError) {
        throw new Error(translationError.message);
      }
    } else if (translationBody) {
      const { error: translationInsertError } = await supabase
        .from("translations")
        .insert({
          parent_type: "event",
          parent_id: eventId,
          language_code: "ko",
          translation_type: "full",
          title: translationTitle || null,
          body: translationBody,
          is_primary: true,
          is_published: true,
        });

      if (translationInsertError) {
        throw new Error(translationInsertError.message);
      }
    }

    const { data: existingYoutube } = await supabase
      .from("media_assets")
      .select("id")
      .eq("parent_type", "event")
      .eq("parent_id", eventId)
      .eq("media_type", "youtube")
      .limit(1)
      .maybeSingle();

    const { data: existingImage } = await supabase
      .from("media_assets")
      .select("id")
      .eq("parent_type", "event")
      .eq("parent_id", eventId)
      .eq("media_type", "image")
      .limit(1)
      .maybeSingle();

    if (existingYoutube?.id && youtubeUrl) {
      const { error } = await supabase
        .from("media_assets")
        .update({
          url: youtubeUrl,
          youtube_video_id: extractYoutubeVideoId(youtubeUrl),
          usage_type: "pv",
          media_type: "youtube",
          title: `${title} PV`,
          is_primary: true,
          sort_order: 0,
        })
        .eq("id", existingYoutube.id);

      if (error) throw new Error(error.message);
    } else if (!existingYoutube?.id && youtubeUrl) {
      const { error } = await supabase
        .from("media_assets")
        .insert({
          parent_type: "event",
          parent_id: eventId,
          media_type: "youtube",
          usage_type: "pv",
          url: youtubeUrl,
          youtube_video_id: extractYoutubeVideoId(youtubeUrl),
          title: `${title} PV`,
          is_primary: true,
          sort_order: 0,
        });

      if (error) throw new Error(error.message);
    } else if (existingYoutube?.id && !youtubeUrl) {
      const { error } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", existingYoutube.id);

      if (error) throw new Error(error.message);
    }

    if (existingImage?.id && thumbnailUrl) {
      const { error } = await supabase
        .from("media_assets")
        .update({
          url: thumbnailUrl,
          usage_type: "thumbnail",
          media_type: "image",
          title: `${title} 썸네일`,
          is_primary: !youtubeUrl,
          sort_order: youtubeUrl ? 1 : 0,
        })
        .eq("id", existingImage.id);

      if (error) throw new Error(error.message);
    } else if (!existingImage?.id && thumbnailUrl) {
      const { error } = await supabase
        .from("media_assets")
        .insert({
          parent_type: "event",
          parent_id: eventId,
          media_type: "image",
          usage_type: "thumbnail",
          url: thumbnailUrl,
          title: `${title} 썸네일`,
          is_primary: !youtubeUrl,
          sort_order: youtubeUrl ? 1 : 0,
        });

      if (error) throw new Error(error.message);
    } else if (existingImage?.id && !thumbnailUrl) {
      const { error } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", existingImage.id);

      if (error) throw new Error(error.message);
    }

    await syncIncomingRelationsBySlugs({
      childType: "event",
      childId: eventId,
      parentType: "card",
      relationType: "card_event",
      slugs: linkedCardSlugs,
    });

    await syncIncomingRelationsBySlugs({
      childType: "event",
      childId: eventId,
      parentType: "story",
      relationType: "story_event",
      slugs: linkedStorySlugs,
    });

    await syncIncomingRelationsBySlugs({
      childType: "event",
      childId: eventId,
      parentType: "phone_item",
      relationType: "phone_event",
      slugs: linkedPhoneItemSlugs,
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    revalidatePath(`/events/${slug}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    redirect(`/admin/events/${safeSlug}/edit?error=${encodeURIComponent(message)}`);
  }

  if (submitIntent === "view") {
    redirect(`/events/${safeSlug}`);
  }

  redirect(`/admin/events/${safeSlug}/edit?saved=1`);
}

export async function deleteEventBundle(formData: FormData) {
  await requireAdmin();

  const eventId = String(formData.get("eventId") ?? "").trim();

  if (!eventId) {
    throw new Error("eventId가 없습니다.");
  }

  await deleteTypedRelations("event", eventId);

  await deleteCommonItemChildren({
    itemType: "event",
    itemId: eventId,
    deleteTranslations: true,
    deleteMedia: true,
    deleteTags: true,
    deleteCharacters: true,
  });

  const { error: eventError } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (eventError) {
    throw new Error(`events 삭제 실패: ${eventError.message}`);
  }

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/stories");
  redirect("/admin/events");
}

export async function deleteCard(formData: FormData) {
  await requireAdmin();

  const cardId = String(formData.get("cardId") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();

  if (!cardId) {
    throw new Error("cardId가 없습니다.");
  }

  await deleteTypedRelations("card", cardId);

  await deleteCommonItemChildren({
    itemType: "card",
    itemId: cardId,
    deleteTranslations: true,
    deleteMedia: true,
    deleteTags: true,
    deleteCharacters: true,
  });

  const { error: cardError } = await supabase
    .from("cards")
    .delete()
    .eq("id", cardId);

  if (cardError) {
    throw new Error(`cards 삭제 실패: ${cardError.message}`);
  }

  revalidatePath("/admin/cards");
  revalidatePath("/cards");

  if (rawSlug) {
    revalidatePath(`/cards/${rawSlug}`);
  }

  redirect("/admin/cards");
}

export async function createBulkRelation(formData: FormData) {
  try {
    const parentType = String(formData.get("parentType") || "").trim();
    const parentSlug = String(formData.get("parentSlug") || "").trim();
    const childType = String(formData.get("childType") || "").trim();
    const childSlugsRaw = String(formData.get("childSlugs") || "").trim();
    const relationType = String(formData.get("relationType") || "").trim();

    if (!parentType || !parentSlug || !childType || !relationType) {
      throw new Error("parentType, parentSlug, childType, relationType는 필수입니다.");
    }

    const allowedTypes = ["card", "story", "event", "phone_item"];
    if (!allowedTypes.includes(parentType) || !allowedTypes.includes(childType)) {
      throw new Error("허용되지 않은 parentType 또는 childType 입니다.");
    }

    const childSlugs = childSlugsRaw
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);

    if (childSlugs.length === 0) {
      throw new Error("연결할 child slug가 없습니다.");
    }

    const parentTable =
      parentType === "card"
        ? "cards"
        : parentType === "story"
        ? "stories"
        : parentType === "event"
        ? "events"
        : "phone_items";

    const childTable =
      childType === "card"
        ? "cards"
        : childType === "story"
        ? "stories"
        : childType === "event"
        ? "events"
        : "phone_items";

    const { data: parent, error: parentError } = await supabase
      .from(parentTable)
      .select("id, slug")
      .eq("slug", parentSlug)
      .single();

    if (parentError || !parent) {
      throw new Error(`parent 조회 실패: ${parentError?.message || parentSlug}`);
    }

    const { data: children, error: childrenError } = await supabase
      .from(childTable)
      .select("id, slug")
      .in("slug", childSlugs);

    if (childrenError) {
      throw new Error(`child 조회 실패: ${childrenError.message}`);
    }

    const foundChildren = children ?? [];
    const foundSlugSet = new Set(foundChildren.map((item) => item.slug));
    const missingSlugs = childSlugs.filter((slug) => !foundSlugSet.has(slug));

    if (missingSlugs.length > 0) {
      throw new Error(`찾을 수 없는 child slug:\n${missingSlugs.join("\n")}`);
    }

    const rows = foundChildren.map((child, index) => ({
      parent_type: parentType,
      parent_id: parent.id,
      child_type: childType,
      child_id: child.id,
      relation_type: relationType,
      sort_order: index,
    }));

    const { error: insertError } = await supabase
      .from("item_relations")
      .insert(rows);

    if (insertError) {
      throw new Error(insertError.message);
    }

    revalidatePath("/admin/relations");
    revalidatePath("/admin/cards");
    revalidatePath("/admin/stories");
    revalidatePath("/admin/events");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    redirect(`/admin/relations/new?error=${encodeURIComponent(message)}`);
  }

  redirect("/admin/relations");
}



export async function createPhoneItem(formData: FormData) {
  return createPhoneItemAction(formData);
}

export async function updatePhoneItem(formData: FormData) {
  return updatePhoneItemAction(formData);
}

export async function deletePhoneItem(formData: FormData) {
  return deletePhoneItemAction(formData);
}

export async function createCalendarEntry(formData: FormData) {
  const admin = await isAdmin();

  if (!admin) {
    throw new Error("관리자만 등록할 수 있습니다.");
  }

  const title = String(formData.get("title") || "").trim();
  const scheduleDate = String(formData.get("scheduleDate") || "").trim();
  const note = String(formData.get("note") || "").trim();
  const kind = String(formData.get("kind") || "event").trim();

  if (!title) {
    throw new Error("제목이 비어 있습니다.");
  }

  if (!scheduleDate) {
    throw new Error("날짜를 선택해 주세요.");
  }

  const { error } = await supabase.from("calendar_entries").insert({
    title,
    schedule_date: scheduleDate,
    note: note || null,
    kind,
    is_published: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}

export async function updateCalendarEntry(formData: FormData) {
  const admin = await isAdmin();

  if (!admin) {
    throw new Error("관리자만 수정할 수 있습니다.");
  }

  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const scheduleDate = String(formData.get("scheduleDate") || "").trim();
  const note = String(formData.get("note") || "").trim();
  const kind = String(formData.get("kind") || "event").trim();

  if (!id) {
    throw new Error("수정할 일정 id가 없습니다.");
  }

  if (!title) {
    throw new Error("제목이 비어 있습니다.");
  }

  if (!scheduleDate) {
    throw new Error("날짜를 선택해 주세요.");
  }

  const { error } = await supabase
    .from("calendar_entries")
    .update({
      title,
      schedule_date: scheduleDate,
      note: note || null,
      kind,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}

export async function deleteCalendarEntry(formData: FormData) {
  const admin = await isAdmin();

  if (!admin) {
    throw new Error("관리자만 삭제할 수 있습니다.");
  }

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("삭제할 일정 id가 없습니다.");
  }

  const { error } = await supabase
    .from("calendar_entries")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}

async function upsertStoryTranslation({
  translationId,
  storyId,
  languageCode,
  title,
  body,
  isPrimary,
}: {
  translationId?: string;
  storyId: string;
  languageCode: string;
  title: string;
  body: string;
  isPrimary: boolean;
}) {
  const hasContent = title.trim() || body.trim();

  if (translationId) {
    if (!hasContent) {
      const { error } = await supabase
        .from("translations")
        .delete()
        .eq("id", translationId);

      if (error) throw new Error(error.message);
      return;
    }

    const { error } = await supabase
      .from("translations")
      .update({
        title: title || null,
        body,
        language_code: languageCode,
        is_primary: isPrimary,
        is_published: true,
      })
      .eq("id", translationId);

    if (error) throw new Error(error.message);
    return;
  }

  if (!hasContent) return;

  const { error } = await supabase.from("translations").insert({
    parent_type: "story",
    parent_id: storyId,
    language_code: languageCode,
    translation_type: "full",
    title: title || null,
    body,
    is_primary: isPrimary,
    is_published: true,
  });

  if (error) throw new Error(error.message);
}

async function upsertStoryYoutubeMedia({
  mediaId,
  storyId,
  title,
  usageType,
  url,
  isPrimary,
  sortOrder,
}: {
  mediaId?: string;
  storyId: string;
  title: string;
  usageType: "pv_cn" | "pv_kr";
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}) {
  if (mediaId) {
    if (!url) {
      const { error } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", mediaId);

      if (error) throw new Error(error.message);
      return;
    }

    const { error } = await supabase
      .from("media_assets")
      .update({
        url,
        youtube_video_id: extractYoutubeVideoId(url),
        media_type: "youtube",
        usage_type: usageType,
        title,
        is_primary: isPrimary,
        sort_order: sortOrder,
      })
      .eq("id", mediaId);

    if (error) throw new Error(error.message);
    return;
  }

  if (!url) return;

  const { error } = await supabase.from("media_assets").insert({
    parent_type: "story",
    parent_id: storyId,
    media_type: "youtube",
    usage_type: usageType,
    url,
    youtube_video_id: extractYoutubeVideoId(url),
    title,
    is_primary: isPrimary,
    sort_order: sortOrder,
  });

  if (error) throw new Error(error.message);
}

export async function createAnonymousMessage(formData: FormData) {
  const nickname = String(formData.get("nickname") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const isPrivate = String(formData.get("isPrivate") || "") === "on";

  if (!content) {
    throw new Error("내용을 입력해.");
  }

  if (content.length > 500) {
    throw new Error("내용이 너무 김.");
  }

  if (nickname.length > 20) {
    throw new Error("닉네임이 너무 김.");
  }

  const { error } = await supabase.from("anonymous_messages").insert({
    nickname: nickname || null,
    content,
    is_private: isPrivate,
    is_approved: false,
    is_deleted: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin/anonymous");
}

export async function approveAnonymousMessage(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const approved = String(formData.get("approved") || "") === "true";

  const { error } = await supabase
    .from("anonymous_messages")
    .update({ is_approved: approved })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/anonymous");
}

export async function deleteAnonymousMessage(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");

  const { error } = await supabase
    .from("anonymous_messages")
    .update({ is_deleted: true })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/anonymous");
}

async function getPublicAnonymousMessages() {
  const { data, error } = await supabase
    .from("anonymous_messages")
    .select("id, nickname, content, created_at")
    .eq("is_private", false)
    .eq("is_approved", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("[HomeMixedBody] anonymous fetch error:", error);
    return [];
  }

  return data ?? [];
}