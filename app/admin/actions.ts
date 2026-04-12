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

import {
  parseMessageBulk,
  parseMomentBulk,
} from "@/lib/admin/phoneBulkParsers";

function slugify(input: string) {
  return input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "event";
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
}) {
  const base = slugify(params.title);

  return {
    slug: `${params.serverKey}-${params.year}-${params.subtype}-${params.characterKey}-${base}`,
    originKey: `event:${params.serverKey}:${params.year}:${params.subtype}:${params.characterKey}:${base}`,
    contentId: `event_${params.serverKey}_${params.year}_${params.subtype}_${params.characterKey}_${base}`,
  };
}


function extractYoutubeVideoId(url: string) {
  const regExp = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export async function createCard(formData: FormData) {
  let targetSlug = "";

  try {
    const title = String(formData.get("title") || "").trim();
    const rarity = String(formData.get("rarity") || "ssr").trim();
    const attribute = String(formData.get("attribute") || "affinity").trim();
    const releaseYear = Number(formData.get("releaseYear") || 2025);
    const releaseDate = String(formData.get("releaseDate") || "").trim();
    const summary = String(formData.get("summary") || "").trim();
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
        is_published: true,
      })
      .select("id")
      .single();

    if (cardError || !insertedCard) {
      throw new Error(cardError?.message || "cards 저장 실패");
    }

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

  redirect(`/admin/cards/${encodeURIComponent(targetSlug)}/edit`);
}

export async function createStory(formData: FormData) {
  const title = String(formData.get("title") || "");
  const subtype = String(formData.get("subtype") || "card_story");
  const releaseYear = Number(formData.get("releaseYear") || 2025);
  const releaseDate = String(formData.get("releaseDate") || "");
  const summary = String(formData.get("summary") || "");
  const serverKey = String(formData.get("serverKey") || "kr");
  const characterKey = String(formData.get("characterKey") || "baiqi");

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

  const { error } = await supabase.from("stories").insert({
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
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/stories");
  revalidatePath("/stories");
  redirect("/admin/stories");
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

export async function updateCard(formData: FormData) {
  const rawSlug = String(formData.get("slug") || "").trim();
  const safeSlug = encodeURIComponent(rawSlug);

  try {
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
      })
      .eq("id", cardId);

    if (error) {
      throw new Error(error.message);
    }

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

    await syncRelationsBySlugs({
      parentType: "card",
      parentId: cardId,
      childType: "story",
      relationType: "card_story",
      slugs: linkedStorySlugs,
    });

    await syncRelationsBySlugs({
      parentType: "card",
      parentId: cardId,
      childType: "phone_item",
      relationType: "card_phone",
      slugs: linkedPhoneItemSlugs,
    });

    await syncRelationsBySlugs({
      parentType: "card",
      parentId: cardId,
      childType: "event",
      relationType: "card_event",
      slugs: linkedEventSlugs,
    });

    revalidatePath("/admin/cards");
    revalidatePath("/cards");
    revalidatePath(`/cards/${rawSlug}`);
  } catch (error) {
    console.error("[updateCard] fatal error:", error);

    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    redirect(`/admin/cards/${safeSlug}/edit?error=${encodeURIComponent(message)}`);
  }

  redirect("/admin/cards");
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

export async function createStoryBundle(formData: FormData) {
  let createdStoryId: string | null = null;
  let targetSlug = "";

  try {
    const title = String(formData.get("title") || "").trim();
    const subtype = String(formData.get("subtype") || "card_story").trim();
    const releaseYear = Number(formData.get("releaseYear") || 2025);
    const releaseDate = String(formData.get("releaseDate") || "").trim();
    const summary = String(formData.get("summary") || "").trim();
    const serverKey = String(formData.get("serverKey") || "kr").trim();
    const characterKey = String(formData.get("characterKey") || "baiqi").trim();

    const translationTitle = String(formData.get("translationTitle") || "").trim();
    const translationBody = String(formData.get("translationBody") || "").trim();

    const youtubeUrl = String(formData.get("youtubeUrl") || "").trim();
    const coverImageUrl = String(formData.get("coverImageUrl") || "").trim();
    const cardSlug = String(formData.get("cardSlug") || "").trim();

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

    targetSlug = slug;

    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("id")
      .eq("key", serverKey)
      .single();

    if (serverError || !server) {
      console.error("[createStoryBundle] server lookup error:", serverError);
      throw new Error(`server 조회 실패: ${serverError?.message || serverKey}`);
    }

    const { data: character, error: characterError } = await supabase
      .from("characters")
      .select("id")
      .eq("key", characterKey)
      .single();

    if (characterError || !character) {
      console.error("[createStoryBundle] character lookup error:", characterError);
      throw new Error(`character 조회 실패: ${characterError?.message || characterKey}`);
    }

    const { data: insertedStory, error: storyError } = await supabase
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
      .select("id")
      .single();

    if (storyError || !insertedStory) {
      console.error("[createStoryBundle] story insert error:", storyError);
      throw new Error(storyError?.message || "stories 저장 실패");
    }

    createdStoryId = insertedStory.id;

    if (translationBody) {
      const { error: translationError } = await supabase
        .from("translations")
        .insert({
          parent_type: "story",
          parent_id: insertedStory.id,
          language_code: "ko",
          translation_type: "full",
          title: translationTitle || null,
          body: translationBody,
          is_primary: true,
          is_published: true,
        });

      if (translationError) {
        console.error("[createStoryBundle] translation insert error:", translationError);
        throw new Error(`translations 저장 실패: ${translationError.message}`);
      }
    }

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
        console.error("[createStoryBundle] cover insert error:", imageError);
        throw new Error(`cover 이미지 저장 실패: ${imageError.message}`);
      }
    }

    if (youtubeUrl) {
      const youtubeVideoId = extractYoutubeVideoId(youtubeUrl);

      const { error: mediaError } = await supabase
        .from("media_assets")
        .insert({
          parent_type: "story",
          parent_id: insertedStory.id,
          media_type: "youtube",
          usage_type: "pv",
          url: youtubeUrl,
          youtube_video_id: youtubeVideoId,
          title: `${title} PV`,
          is_primary: !coverImageUrl,
          sort_order: coverImageUrl ? 1 : 0,
        });

      if (mediaError) {
        console.error("[createStoryBundle] youtube insert error:", mediaError);
        throw new Error(`youtube 저장 실패: ${mediaError.message}`);
      }
    }

    if (cardSlug) {
      const { data: card, error: cardError } = await supabase
        .from("cards")
        .select("id")
        .eq("slug", cardSlug)
        .single();

      if (cardError) {
        console.error("[createStoryBundle] card lookup error:", cardError);
        throw new Error(`card 조회 실패: ${cardError.message}`);
      }

      if (!card) {
        throw new Error(`연결할 card를 찾을 수 없습니다: ${cardSlug}`);
      }

      const { error: relationError } = await supabase
        .from("item_relations")
        .insert({
          parent_type: "card",
          parent_id: card.id,
          child_type: "story",
          child_id: insertedStory.id,
          relation_type: "card_story",
          sort_order: 0,
        });

      if (relationError) {
        console.error("[createStoryBundle] relation insert error:", relationError);
        throw new Error(`card relation 저장 실패: ${relationError.message}`);
      }
    }

    revalidatePath("/admin/stories");
    revalidatePath("/stories");
  } catch (error) {
    console.error("[createStoryBundle] fatal error:", error);

    if (createdStoryId) {
      console.error(
        "[createStoryBundle] 부분 저장됨. story id:",
        createdStoryId,
        "slug:",
        targetSlug
      );
    }

    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    redirect(`/admin/stories/new?error=${encodeURIComponent(message)}`);
  }

  redirect(`/admin/stories/${encodeURIComponent(targetSlug)}/edit`);
}

export async function updateStoryBundle(formData: FormData) {
  const storyId = String(formData.get("storyId") || "");
  const title = String(formData.get("title") || "");
  const subtype = String(formData.get("subtype") || "card_story");
  const releaseYear = Number(formData.get("releaseYear") || 2025);
  const releaseDate = String(formData.get("releaseDate") || "");
  const summary = String(formData.get("summary") || "");

  const translationId = String(formData.get("translationId") || "");
  const translationTitle = String(formData.get("translationTitle") || "");
  const translationBody = String(formData.get("translationBody") || "");

  const mediaId = String(formData.get("mediaId") || "");
  const youtubeUrl = String(formData.get("youtubeUrl") || "");

  const coverMediaId = String(formData.get("coverMediaId") || "");
  const coverImageUrl = String(formData.get("coverImageUrl") || "");

  const relationId = String(formData.get("relationId") || "");
  const cardSlug = String(formData.get("cardSlug") || "");

  const { error: storyError } = await supabase
    .from("stories")
    .update({
      title,
      subtype,
      release_year: releaseYear,
      release_date: releaseDate || null,
      summary,
    })
    .eq("id", storyId);

  if (storyError) {
    throw new Error(storyError.message);
  }

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
  } else if (translationBody.trim()) {
    const { error: translationInsertError } = await supabase
      .from("translations")
      .insert({
        parent_type: "story",
        parent_id: storyId,
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

  if (coverMediaId) {
    const { error: coverError } = await supabase
      .from("media_assets")
      .update({
        url: coverImageUrl,
        usage_type: "cover",
        media_type: "image",
        title: `${title} 대표 이미지`,
      })
      .eq("id", coverMediaId);

    if (coverError) {
      throw new Error(coverError.message);
    }
  } else if (coverImageUrl.trim()) {
    const { error: coverInsertError } = await supabase
      .from("media_assets")
      .insert({
        parent_type: "story",
        parent_id: storyId,
        media_type: "image",
        usage_type: "cover",
        url: coverImageUrl,
        title: `${title} 대표 이미지`,
        is_primary: true,
        sort_order: 0,
      });

    if (coverInsertError) {
      throw new Error(coverInsertError.message);
    }
  }

  if (mediaId) {
    const { error: mediaError } = await supabase
      .from("media_assets")
      .update({
        url: youtubeUrl,
        youtube_video_id: extractYoutubeVideoId(youtubeUrl),
      })
      .eq("id", mediaId);

    if (mediaError) {
      throw new Error(mediaError.message);
    }
  } else if (youtubeUrl.trim()) {
    const { error: mediaInsertError } = await supabase
      .from("media_assets")
      .insert({
        parent_type: "story",
        parent_id: storyId,
        media_type: "youtube",
        usage_type: "pv",
        url: youtubeUrl,
        youtube_video_id: extractYoutubeVideoId(youtubeUrl),
        title: `${title} PV`,
        is_primary: !coverImageUrl.trim(),
        sort_order: coverImageUrl.trim() ? 1 : 0,
      });

    if (mediaInsertError) {
      throw new Error(mediaInsertError.message);
    }
  }

  if (relationId) {
    if (cardSlug.trim()) {
      const { data: card } = await supabase
        .from("cards")
        .select("id")
        .eq("slug", cardSlug)
        .single();

      if (card) {
        const { error: relationError } = await supabase
          .from("item_relations")
          .update({
            parent_id: card.id,
          })
          .eq("id", relationId);

        if (relationError) {
          throw new Error(relationError.message);
        }
      }
    }
  } else if (cardSlug.trim()) {
    const { data: card } = await supabase
      .from("cards")
      .select("id")
      .eq("slug", cardSlug)
      .single();

    if (card) {
      const { error: relationInsertError } = await supabase
        .from("item_relations")
        .insert({
          parent_type: "card",
          parent_id: card.id,
          child_type: "story",
          child_id: storyId,
          relation_type: "card_story",
          sort_order: 0,
        });

      if (relationInsertError) {
        throw new Error(relationInsertError.message);
      }
    }
  }

  revalidatePath("/admin/stories");
  revalidatePath("/stories");
  redirect("/admin/stories");
}

export async function deleteStoryBundle(formData: FormData) {
  const storyId = String(formData.get("storyId") ?? "").trim();

  if (!storyId) {
    throw new Error("storyId가 없습니다.");
  }

  const { error: relationError } = await supabase
    .from("item_relations")
    .delete()
    .or(`parent_id.eq.${storyId},child_id.eq.${storyId}`);

  if (relationError) {
    throw new Error(`item_relations 삭제 실패: ${relationError.message}`);
  }

  const { error: translationError } = await supabase
    .from("translations")
    .delete()
    .eq("parent_type", "story")
    .eq("parent_id", storyId);

  if (translationError) {
    throw new Error(`translations 삭제 실패: ${translationError.message}`);
  }

  const { error: mediaError } = await supabase
    .from("media_assets")
    .delete()
    .eq("parent_type", "story")
    .eq("parent_id", storyId);

  if (mediaError) {
    throw new Error(`media_assets 삭제 실패: ${mediaError.message}`);
  }

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

  try {
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
    const cardSlug = String(formData.get("cardSlug") || "").trim();
    const relatedEventSlug = String(formData.get("relatedEventSlug") || "").trim();

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
        is_published: true,
      })
      .select("id")
      .single();

    if (eventError || !insertedEvent) {
      throw new Error(eventError?.message || "events 저장 실패");
    }

    createdEventId = insertedEvent.id;

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

    if (cardSlug) {
      const { data: card, error: cardError } = await supabase
        .from("cards")
        .select("id")
        .eq("slug", cardSlug)
        .single();

      if (cardError || !card) {
        throw new Error(`card 조회 실패: ${cardError?.message || cardSlug}`);
      }

      const { error: relationError } = await supabase
        .from("item_relations")
        .insert({
          parent_type: "card",
          parent_id: card.id,
          child_type: "event",
          child_id: insertedEvent.id,
          relation_type: "related_card",
          sort_order: 0,
        });

      if (relationError) {
        throw new Error(`card relation 저장 실패: ${relationError.message}`);
      }
    }

    if (relatedEventSlug) {
      const { data: relatedEvent, error: relatedEventError } = await supabase
        .from("events")
        .select("id")
        .eq("slug", relatedEventSlug)
        .single();

      if (relatedEventError || !relatedEvent) {
        throw new Error(`related event 조회 실패: ${relatedEventError?.message || relatedEventSlug}`);
      }

      const { error: relationError } = await supabase
        .from("item_relations")
        .insert({
          parent_type: "event",
          parent_id: relatedEvent.id,
          child_type: "event",
          child_id: insertedEvent.id,
          relation_type: "related_event",
          sort_order: 0,
        });

      if (relationError) {
        throw new Error(`event relation 저장 실패: ${relationError.message}`);
      }
    }

    revalidatePath("/admin/events");
    revalidatePath("/events");
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

 redirect(`/admin/events/${encodeURIComponent(targetSlug)}/edit`);
}

export async function updateEventBundle(formData: FormData) {
  const eventId = String(formData.get("eventId") || "").trim();
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

  const hasCardSlugField = formData.has("cardSlug");
  const hasRelatedEventSlugField = formData.has("relatedEventSlug");
  const cardSlug = String(formData.get("cardSlug") || "").trim();
  const relatedEventSlug = String(formData.get("relatedEventSlug") || "").trim();

  if (!eventId) {
    throw new Error("eventId가 없습니다.");
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
      is_published: isPublished,
    })
    .eq("id", eventId);

  if (eventError) {
    throw new Error(eventError.message);
  }

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

  if (hasCardSlugField) {
    const { data: existingCardRelation } = await supabase
      .from("item_relations")
      .select("id")
      .eq("child_type", "event")
      .eq("child_id", eventId)
      .eq("parent_type", "card")
      .limit(1)
      .maybeSingle();

    if (cardSlug) {
      const { data: card, error: cardError } = await supabase
        .from("cards")
        .select("id")
        .eq("slug", cardSlug)
        .single();

      if (cardError || !card) {
        throw new Error(`card 조회 실패: ${cardError?.message || cardSlug}`);
      }

      if (existingCardRelation?.id) {
        const { error } = await supabase
          .from("item_relations")
          .update({
            parent_id: card.id,
            relation_type: "related_card",
          })
          .eq("id", existingCardRelation.id);

        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("item_relations")
          .insert({
            parent_type: "card",
            parent_id: card.id,
            child_type: "event",
            child_id: eventId,
            relation_type: "related_card",
            sort_order: 0,
          });

        if (error) throw new Error(error.message);
      }
    } else if (existingCardRelation?.id) {
      const { error } = await supabase
        .from("item_relations")
        .delete()
        .eq("id", existingCardRelation.id);

      if (error) throw new Error(error.message);
    }
  }

  if (hasRelatedEventSlugField) {
    const { data: existingEventRelation } = await supabase
      .from("item_relations")
      .select("id")
      .eq("child_type", "event")
      .eq("child_id", eventId)
      .eq("parent_type", "event")
      .limit(1)
      .maybeSingle();

    if (relatedEventSlug) {
      const { data: relatedEvent, error: relatedEventError } = await supabase
        .from("events")
        .select("id")
        .eq("slug", relatedEventSlug)
        .single();

      if (relatedEventError || !relatedEvent) {
        throw new Error(
          `related event 조회 실패: ${relatedEventError?.message || relatedEventSlug}`
        );
      }

      if (existingEventRelation?.id) {
        const { error } = await supabase
          .from("item_relations")
          .update({
            parent_id: relatedEvent.id,
            relation_type: "related_event",
          })
          .eq("id", existingEventRelation.id);

        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("item_relations")
          .insert({
            parent_type: "event",
            parent_id: relatedEvent.id,
            child_type: "event",
            child_id: eventId,
            relation_type: "related_event",
            sort_order: 0,
          });

        if (error) throw new Error(error.message);
      }
    } else if (existingEventRelation?.id) {
      const { error } = await supabase
        .from("item_relations")
        .delete()
        .eq("id", existingEventRelation.id);

      if (error) throw new Error(error.message);
    }
  }

  revalidatePath("/admin/events");
  revalidatePath("/events");
  redirect("/admin/events");
}

export async function deleteEventBundle(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "").trim();

  if (!eventId) {
    throw new Error("eventId가 없습니다.");
  }

  const { error: relationError } = await supabase
    .from("item_relations")
    .delete()
    .or(`parent_id.eq.${eventId},child_id.eq.${eventId}`);

  if (relationError) {
    throw new Error(`item_relations 삭제 실패: ${relationError.message}`);
  }

  const { error: translationError } = await supabase
    .from("translations")
    .delete()
    .eq("parent_type", "event")
    .eq("parent_id", eventId);

  if (translationError) {
    throw new Error(`translations 삭제 실패: ${translationError.message}`);
  }

  const { error: mediaError } = await supabase
    .from("media_assets")
    .delete()
    .eq("parent_type", "event")
    .eq("parent_id", eventId);

  if (mediaError) {
    throw new Error(`media_assets 삭제 실패: ${mediaError.message}`);
  }

  const { error: eventError } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (eventError) {
    throw new Error(`events 삭제 실패: ${eventError.message}`);
  }

  revalidatePath("/admin/events");
  revalidatePath("/events");
  redirect("/admin/events");
}

export async function deleteCard(formData: FormData) {
  const cardId = String(formData.get("cardId") ?? "").trim();

  if (!cardId) {
    throw new Error("cardId가 없습니다.");
  }

  const { error: relationError } = await supabase
    .from("item_relations")
    .delete()
    .or(`parent_id.eq.${cardId},child_id.eq.${cardId}`);

  if (relationError) {
    throw new Error(`item_relations 삭제 실패: ${relationError.message}`);
  }

  const { error: mediaError } = await supabase
    .from("media_assets")
    .delete()
    .eq("parent_type", "card")
    .eq("parent_id", cardId);

  if (mediaError) {
    throw new Error(`media_assets 삭제 실패: ${mediaError.message}`);
  }

  const { error: cardError } = await supabase
    .from("cards")
    .delete()
    .eq("id", cardId);

  if (cardError) {
    throw new Error(`cards 삭제 실패: ${cardError.message}`);
  }

  revalidatePath("/admin/cards");
  revalidatePath("/cards");
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