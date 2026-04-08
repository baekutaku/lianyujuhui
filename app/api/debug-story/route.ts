import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { buildStoryKeys } from "@/lib/utils/admin-keys";

function extractYoutubeVideoId(url: string) {
  const regExp = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const title = String(formData.get("title") || "").trim();
    const subtype = String(formData.get("subtype") || "card_story").trim();
    const releaseYear = Number(formData.get("releaseYear") || 2025);
    const releaseDate = String(formData.get("releaseDate") || "").trim();
    const summary = String(formData.get("summary") || "").trim();

    const serverKey = String(formData.get("serverKey") || "kr").trim();
    const characterKey = String(formData.get("characterKey") || "baiqi").trim();
    const cardSlug = String(formData.get("cardSlug") || "").trim();

    const translationTitle = String(formData.get("translationTitle") || "").trim();
    const translationBody = String(formData.get("translationBody") || "");
    const youtubeUrl = String(formData.get("youtubeUrl") || "").trim();
    const coverImageUrl = String(
      formData.get("coverImageUrl") || formData.get("imageUrl") || ""
    ).trim();

    if (!title) {
      return NextResponse.json(
        { step: "validation", error: "title is required" },
        { status: 400 }
      );
    }

    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("id")
      .eq("key", serverKey)
      .single();

    if (serverError || !server) {
      return NextResponse.json(
        { step: "server lookup", serverError, server },
        { status: 500 }
      );
    }

    const { data: character, error: characterError } = await supabase
      .from("characters")
      .select("id")
      .eq("key", characterKey)
      .single();

    if (characterError || !character) {
      return NextResponse.json(
        { step: "character lookup", characterError, character },
        { status: 500 }
      );
    }

    let linkedCardId: string | null = null;

    if (cardSlug) {
      const { data: card, error: cardError } = await supabase
        .from("cards")
        .select("id")
        .eq("slug", cardSlug)
        .single();

      if (cardError || !card) {
        return NextResponse.json(
          { step: "card lookup", cardError, card },
          { status: 500 }
        );
      }

      linkedCardId = card.id;
    }

    const { slug, originKey, contentId } = buildStoryKeys({
      subtype,
      characterKey,
      title,
      year: releaseYear,
      serverKey,
    });

    const { data: story, error: storyError } = await supabase
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
        summary: summary || null,
        is_published: true,
      })
      .select("id, slug")
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { step: "story insert", storyError, story },
        { status: 500 }
      );
    }

    if (translationBody.trim() || translationTitle.trim()) {
      const { error: translationError } = await supabase
        .from("translations")
        .insert({
          parent_type: "story",
          parent_id: story.id,
          language_code: "ko",
          translation_type: "full",
          title: translationTitle || null,
          body: translationBody,
          is_primary: true,
          is_published: true,
        });

      if (translationError) {
        return NextResponse.json(
          { step: "translation insert", translationError },
          { status: 500 }
        );
      }
    }

    if (coverImageUrl) {
      const { error: coverError } = await supabase
        .from("media_assets")
        .insert({
          parent_type: "story",
          parent_id: story.id,
          media_type: "image",
          usage_type: "cover",
          url: coverImageUrl,
          title: `${title} 대표 이미지`,
          is_primary: true,
          sort_order: 0,
        });

      if (coverError) {
        return NextResponse.json(
          { step: "cover insert", coverError },
          { status: 500 }
        );
      }
    }

    if (youtubeUrl) {
      const { error: mediaError } = await supabase
        .from("media_assets")
        .insert({
          parent_type: "story",
          parent_id: story.id,
          media_type: "youtube",
          usage_type: "pv",
          url: youtubeUrl,
          youtube_video_id: extractYoutubeVideoId(youtubeUrl),
          title: `${title} PV`,
          is_primary: !coverImageUrl,
          sort_order: coverImageUrl ? 1 : 0,
        });

      if (mediaError) {
        return NextResponse.json(
          { step: "youtube insert", mediaError },
          { status: 500 }
        );
      }
    }

    if (linkedCardId) {
      const { error: relationError } = await supabase
        .from("item_relations")
        .insert({
          parent_type: "card",
          parent_id: linkedCardId,
          child_type: "story",
          child_id: story.id,
          relation_type: "card_story",
          sort_order: 0,
        });

      if (relationError) {
        return NextResponse.json(
          { step: "relation insert", relationError },
          { status: 500 }
        );
      }
    }

    return NextResponse.redirect(
      new URL(`/admin/stories/${story.slug}/edit`, req.url)
    );
  } catch (error) {
    console.error("[debug-story] fatal", error);
    return NextResponse.json(
      {
        step: "fatal catch",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
