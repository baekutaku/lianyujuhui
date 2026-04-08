"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { buildCardKeys, buildStoryKeys } from "@/lib/utils/admin-keys";

function extractYoutubeVideoId(url: string) {
  const regExp = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export async function createCard(formData: FormData) {
  const title = String(formData.get("title") || "");
  const rarity = String(formData.get("rarity") || "ssr");
  const attribute = String(formData.get("attribute") || "affinity");
  const releaseYear = Number(formData.get("releaseYear") || 2025);
  const releaseDate = String(formData.get("releaseDate") || "");
  const summary = String(formData.get("summary") || "");
  const serverKey = String(formData.get("serverKey") || "kr");
  const characterKey = String(formData.get("characterKey") || "baiqi");

  const { slug, originKey, contentId } = buildCardKeys({
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

  const { error } = await supabase.from("cards").insert({
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
    summary,
    is_published: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/cards/${slug}`);
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

export async function updateCard(formData: FormData) {
  const cardId = String(formData.get("cardId") || "");
  const slug = String(formData.get("slug") || "");
  const title = String(formData.get("title") || "");
  const rarity = String(formData.get("rarity") || "ssr");
  const attribute = String(formData.get("attribute") || "affinity");
  const releaseYear = Number(formData.get("releaseYear") || 2025);
  const releaseDate = String(formData.get("releaseDate") || "");
  const summary = String(formData.get("summary") || "");

  const { error } = await supabase
    .from("cards")
    .update({
      title,
      rarity,
      attribute,
      release_year: releaseYear,
      release_date: releaseDate || null,
      summary,
    })
    .eq("id", cardId);

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/cards/${slug}`);
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

  redirect("/admin/stories");
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
