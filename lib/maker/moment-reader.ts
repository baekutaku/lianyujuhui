import { getMakerActor } from "@/lib/maker/auth";
import {
  getMakerCharacterAvatar,
  getMakerCharacterName,
} from "@/lib/maker/defaults";
import { type MakerMomentPayload } from "@/lib/maker/moment-types";
import { supabaseAdmin } from "@/lib/supabase/admin";

type MakerMomentRow = {
  id: string;
  owner_id: string;
  title: string | null;
  author_key: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  preview: string | null;
  payload_json: MakerMomentPayload | null;
  is_deleted: boolean | null;
  created_at: string;
  updated_at: string | null;
};

function normalizeMomentPayload(row: MakerMomentRow) {
  const payload = (row.payload_json ?? {}) as Partial<MakerMomentPayload>;

  const authorKey =
    String(payload.authorKey || row.author_key || "").trim() || "other";
  const authorName =
    String(payload.authorName || row.author_name || "").trim() ||
    getMakerCharacterName(authorKey) ||
    authorKey;
  const authorAvatarUrl =
    String(payload.authorAvatarUrl || row.author_avatar_url || "").trim() ||
    getMakerCharacterAvatar(authorKey) ||
    "";
  const preview =
    String(payload.momentSummary || row.preview || "").trim() ||
    String(payload.momentBody || "").trim().slice(0, 60) ||
    "모멘트 기록";

  return {
    id: row.id,
    title: String(row.title || "").trim() || `${authorName} 모멘트`,
    authorKey,
    authorName,
    authorAvatarUrl,
    preview,
    payload: {
      authorKey,
      authorName,
      authorAvatarUrl,
      authorHasProfile: Boolean(payload.authorHasProfile),

      momentCategory: String(payload.momentCategory || "daily"),
      momentCategoryLabel: String(payload.momentCategoryLabel || "일상"),
      momentYear:
        typeof payload.momentYear === "number" ? payload.momentYear : null,
      momentDateText: String(payload.momentDateText || ""),

      momentBody: String(payload.momentBody || ""),
      momentSummary: String(payload.momentSummary || preview),
      momentSource: String(payload.momentSource || ""),
      momentImageUrls: Array.isArray(payload.momentImageUrls)
        ? payload.momentImageUrls
        : [],

      momentReplyLines: Array.isArray(payload.momentReplyLines)
        ? payload.momentReplyLines
        : [],
      momentChoiceOptions: Array.isArray(payload.momentChoiceOptions)
        ? payload.momentChoiceOptions
        : [],
      momentSelectedOptionId:
        String(payload.momentSelectedOptionId || "") || null,
      momentComments: Array.isArray(payload.momentComments)
        ? payload.momentComments
        : [],

      isFavorite: Boolean(payload.isFavorite),
      isComplete: Boolean(payload.isComplete),
    } satisfies MakerMomentPayload,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

export async function listMakerMoments() {
  const actor = await getMakerActor();
  if (!actor.ownerId) return [];

  const { data, error } = await supabaseAdmin
    .from("maker_moments")
    .select(
      "id, owner_id, title, author_key, author_name, author_avatar_url, preview, payload_json, is_deleted, created_at, updated_at"
    )
    .eq("owner_id", actor.ownerId)
    .eq("is_deleted", false)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as MakerMomentRow[]).map(normalizeMomentPayload);
}

export async function getMakerMoment(momentId: string) {
  const actor = await getMakerActor();
  if (!actor.ownerId) return null;

  const { data, error } = await supabaseAdmin
    .from("maker_moments")
    .select(
      "id, owner_id, title, author_key, author_name, author_avatar_url, preview, payload_json, is_deleted, created_at, updated_at"
    )
    .eq("id", momentId)
    .eq("owner_id", actor.ownerId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;
  return normalizeMomentPayload(data as MakerMomentRow);
}