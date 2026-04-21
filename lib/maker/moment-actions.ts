"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureMakerGuest } from "@/lib/maker/auth";
import {
  type MakerMomentChoiceOption,
  type MakerMomentComment,
  type MakerMomentPayload,
  type MakerMomentReplyLine,
} from "@/lib/maker/moment-types";
import {
  getMakerCharacterAvatar,
  getMakerCharacterName,
} from "@/lib/maker/defaults";
import { supabaseAdmin } from "@/lib/supabase/admin";

function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
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

function parseLineSeparatedUrls(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function revalidateMakerMomentPaths(momentId?: string) {
  revalidatePath("/maker/me");
  revalidatePath("/maker/moments");

  if (momentId) {
    revalidatePath(`/maker/moments/${momentId}`);
    revalidatePath(`/maker/moments/${momentId}/edit`);
  }
}

function getMomentCategoryLabel(category: string) {
  if (category === "card") return "카드";
  if (category === "story") return "스토리";
  return "일상";
}

function resolveSelectedOptionId(options: MakerMomentChoiceOption[]) {
  const historyChoice = options.find((option) => option.id && option.isHistory);
  if (historyChoice?.id) return historyChoice.id;

  const first = options.find((option) => option.id);
  return first?.id ?? null;
}

function resolveMomentFormData(formData: FormData) {
  const title = normalizeText(formData.get("moment_title"));
  const authorKey = normalizeText(formData.get("moment_author_key")) || "other";
  const authorName =
    normalizeText(formData.get("moment_author_name")) ||
    getMakerCharacterName(authorKey) ||
    authorKey;
  const authorAvatarUrl =
    normalizeText(formData.get("moment_author_avatar_url")) ||
    getMakerCharacterAvatar(authorKey) ||
    "";
  const authorHasProfile = formData.get("moment_author_has_profile") === "on";

  const momentCategory =
    normalizeText(formData.get("moment_category")) || "daily";
  const momentYearRaw = normalizeText(formData.get("moment_year"));
  const momentDateText = normalizeText(formData.get("moment_date_text"));

  const momentBody = normalizeText(formData.get("moment_body"));
  const momentSummary =
    normalizeText(formData.get("moment_summary")) ||
    momentBody.slice(0, 60);
  const momentSource = normalizeText(formData.get("moment_source"));

  const imageUrlsText = normalizeText(formData.get("moment_image_urls_text"));
  const replyLinesJson = normalizeText(formData.get("moment_reply_lines_json"));
  const choiceOptionsJson = normalizeText(
    formData.get("moment_choice_options_json")
  );
  const commentsJson = normalizeText(formData.get("moment_comments_json"));

  const isFavorite = formData.get("moment_is_favorite") === "on";
  const isComplete = formData.get("moment_is_complete") === "on";

  const momentReplyLines = parseJsonField<MakerMomentReplyLine[]>(
    replyLinesJson,
    "moment_reply_lines_json",
    []
  );

  const momentChoiceOptions = parseJsonField<MakerMomentChoiceOption[]>(
    choiceOptionsJson,
    "moment_choice_options_json",
    []
  );

  const momentComments = parseJsonField<MakerMomentComment[]>(
    commentsJson,
    "moment_comments_json",
    []
  );

  const momentImageUrls = parseLineSeparatedUrls(imageUrlsText);
  const momentSelectedOptionId = resolveSelectedOptionId(momentChoiceOptions);

  const payload: MakerMomentPayload = {
    authorKey,
    authorName,
    authorAvatarUrl,
    authorHasProfile,

    momentCategory,
    momentCategoryLabel: getMomentCategoryLabel(momentCategory),
    momentYear: momentYearRaw ? Number(momentYearRaw) : null,
    momentDateText,

    momentBody,
    momentSummary,
    momentSource,
    momentImageUrls,

    momentReplyLines,
    momentChoiceOptions,
    momentSelectedOptionId,
    momentComments,

    isFavorite,
    isComplete,
  };

  return {
    title: title || `${authorName} 모멘트`,
    preview: momentSummary || momentBody.slice(0, 60),
    authorKey,
    authorName,
    authorAvatarUrl,
    payload,
  };
}

export async function createMakerMomentFromForm(formData: FormData) {
  const { guestId } = await ensureMakerGuest();
  const resolved = resolveMomentFormData(formData);

  const { data, error } = await supabaseAdmin
    .from("maker_moments")
    .insert({
      owner_id: guestId,
      title: resolved.title,
      author_key: resolved.authorKey,
      author_name: resolved.authorName,
      author_avatar_url: resolved.authorAvatarUrl || null,
      preview: resolved.preview,
      payload_json: resolved.payload,
      is_deleted: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "maker_moments 저장 실패");
  }

  revalidateMakerMomentPaths(data.id);
redirect("/maker/moments?saved=1");
}

export async function updateMakerMomentFromForm(formData: FormData) {
  const { guestId } = await ensureMakerGuest();
  const momentId = normalizeText(formData.get("momentId"));

  if (!momentId) {
    throw new Error("momentId가 없습니다.");
  }

  const resolved = resolveMomentFormData(formData);

  const { error } = await supabaseAdmin
    .from("maker_moments")
    .update({
      title: resolved.title,
      author_key: resolved.authorKey,
      author_name: resolved.authorName,
      author_avatar_url: resolved.authorAvatarUrl || null,
      preview: resolved.preview,
      payload_json: resolved.payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", momentId)
    .eq("owner_id", guestId)
    .eq("is_deleted", false);

  if (error) {
    throw new Error(error.message);
  }

revalidateMakerMomentPaths(momentId);
redirect("/maker/moments?saved=1");
}

export async function softDeleteMakerMoment(formData: FormData) {
  const { guestId } = await ensureMakerGuest();
  const momentId = normalizeText(formData.get("momentId"));

  if (!momentId) {
    throw new Error("momentId가 없습니다.");
  }

  const { error } = await supabaseAdmin
    .from("maker_moments")
    .update({
      is_deleted: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", momentId)
    .eq("owner_id", guestId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateMakerMomentPaths(momentId);
  redirect("/maker/moments");
}

