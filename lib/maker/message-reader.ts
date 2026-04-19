import { getMakerActor } from "@/lib/maker/auth";
import {
  MAKER_CHARACTER_AVATAR_MAP,
  MAKER_CHARACTER_NAME_MAP,
} from "@/lib/maker/defaults";
import { type MakerMessagePayload } from "@/lib/maker/message-types";
import { supabaseAdmin } from "@/lib/supabase/admin";

type MakerMessageThreadRow = {
  id: string;
  owner_id: string;
  title: string | null;
  character_key: string | null;
  character_name: string | null;
  avatar_url: string | null;
  preview: string | null;
  payload_json: MakerMessagePayload | null;
  is_deleted: boolean | null;
  created_at: string;
  updated_at: string | null;
};

function normalizeMessagePayload(row: MakerMessageThreadRow) {
  const payload = (row.payload_json ?? {}) as Partial<MakerMessagePayload>;
  const characterKey =
    String(payload.characterKey || row.character_key || "").trim() || "baiqi";
  const characterName =
    String(payload.characterName || row.character_name || "").trim() ||
    MAKER_CHARACTER_NAME_MAP[characterKey] ||
    characterKey;
  const avatarUrl =
    String(payload.avatarUrl || row.avatar_url || "").trim() ||
    MAKER_CHARACTER_AVATAR_MAP[characterKey] ||
    "";
  const preview =
    String(payload.preview || row.preview || "").trim() ||
    String(row.title || "").trim() ||
    "메시지 기록";

  const editorEntries = Array.isArray(payload.editorEntries)
    ? payload.editorEntries
    : [];
  const entries = Array.isArray(payload.entries) ? payload.entries : [];

  return {
    id: row.id,
    title: String(row.title || "").trim() || `${characterName} 메시지`,
    characterKey,
    characterName,
    avatarUrl,
    preview,
    entriesForView: editorEntries.length > 0 ? editorEntries : entries,
    payload: {
      preview,
      characterKey,
      characterName,
      avatarUrl,
      entries,
      editorEntries,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

export async function listMakerMessageThreads() {
  const actor = await getMakerActor();
  if (!actor.ownerId) return [];

  const { data, error } = await supabaseAdmin
    .from("maker_message_threads")
    .select(
      "id, owner_id, title, character_key, character_name, avatar_url, preview, payload_json, is_deleted, created_at, updated_at"
    )
    .eq("owner_id", actor.ownerId)
    .eq("is_deleted", false)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as MakerMessageThreadRow[]).map(normalizeMessagePayload);
}

export async function getMakerMessageThread(threadId: string) {
  const actor = await getMakerActor();
  if (!actor.ownerId) return null;

  const { data, error } = await supabaseAdmin
    .from("maker_message_threads")
    .select(
      "id, owner_id, title, character_key, character_name, avatar_url, preview, payload_json, is_deleted, created_at, updated_at"
    )
    .eq("id", threadId)
    .eq("owner_id", actor.ownerId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;
  return normalizeMessagePayload(data as MakerMessageThreadRow);
}