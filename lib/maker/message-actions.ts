"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseMessageBulk } from "@/lib/admin/phoneBulkParsers";
import { ensureMakerGuest, getMakerActor } from "@/lib/maker/auth";
import {
  buildMakerEditorNodesFromStoredEntries,
  buildMakerMessagePreview,
  flattenMakerMessageNodes,
  parseMakerMessageJsonField,
} from "@/lib/maker/message-serializer";
import {
  type MakerFlatMessageEntry,
  type MakerMessageNode,
} from "@/lib/maker/message-types";
import {
  getMakerCharacterAvatar,
  getMakerCharacterName,
} from "@/lib/maker/defaults";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MAKER_EXAMPLE_OWNER_ID } from "@/lib/maker/constants";


function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function revalidateMakerMessagePaths(threadId?: string) {
  revalidatePath("/maker/me");
  revalidatePath("/maker/messages");

  if (threadId) {
    revalidatePath(`/maker/messages/${threadId}`);
    revalidatePath(`/maker/messages/${threadId}/edit`);
  }
}

function resolveMessageFormData(formData: FormData) {
  const title = normalizeText(formData.get("title"));
  const previewInput = normalizeText(formData.get("preview"));
  const characterKey = normalizeText(formData.get("character_key")) || "baiqi";
  const characterName =
    normalizeText(formData.get("character_name")) ||
    getMakerCharacterName(characterKey) ||
    characterKey;
  const avatarUrl =
    normalizeText(formData.get("avatar_url")) ||
    getMakerCharacterAvatar(characterKey) ||
    "";
  const raw = normalizeText(formData.get("message_bulk_raw"));
  const entriesJson = normalizeText(formData.get("entries_json"));
  const editorEntriesJson = normalizeText(formData.get("editor_entries_json"));

  const entries = entriesJson
    ? parseMakerMessageJsonField<MakerFlatMessageEntry[]>(
        entriesJson,
        "entries_json",
        []
      )
    : raw
      ? (parseMessageBulk(raw) as MakerFlatMessageEntry[])
      : [];

  const editorEntries = editorEntriesJson
    ? parseMakerMessageJsonField<MakerMessageNode[]>(
        editorEntriesJson,
        "editor_entries_json",
        buildMakerEditorNodesFromStoredEntries(entries as any[])
      )
    : buildMakerEditorNodesFromStoredEntries(entries as any[]);

  const flatEntries =
    entries.length > 0 ? entries : flattenMakerMessageNodes(editorEntries);

  const preview =
    previewInput ||
    buildMakerMessagePreview(editorEntries, title || "메시지 기록") ||
    "메시지 기록";

  return {
    title: title || `${characterName} 메시지`,
    preview,
    characterKey,
    characterName,
    avatarUrl,
    entries: flatEntries,
    editorEntries,
  };
}

export async function createMakerMessageFromForm(formData: FormData) {
  const { guestId } = await ensureMakerGuest();
  const resolved = resolveMessageFormData(formData);

  const { data, error } = await supabaseAdmin
    .from("maker_message_threads")
    .insert({
      owner_id: guestId,
      title: resolved.title,
      character_key: resolved.characterKey,
      character_name: resolved.characterName,
      avatar_url: resolved.avatarUrl || null,
      preview: resolved.preview,
      payload_json: {
        preview: resolved.preview,
        characterKey: resolved.characterKey,
        characterName: resolved.characterName,
        avatarUrl: resolved.avatarUrl,
        entries: resolved.entries,
        editorEntries: resolved.editorEntries,
      },
      is_deleted: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "maker_message_threads 저장 실패");
  }

  revalidateMakerMessagePaths(data.id);
  redirect(`/maker/messages/${data.id}/edit?saved=1`);
}

export async function updateMakerMessageFromForm(formData: FormData) {
  const { guestId } = await ensureMakerGuest();
  const threadId = normalizeText(formData.get("threadId"));

  if (!threadId) {
    throw new Error("threadId가 없습니다.");
  }

  const resolved = resolveMessageFormData(formData);

  const { error } = await supabaseAdmin
    .from("maker_message_threads")
    .update({
      title: resolved.title,
      character_key: resolved.characterKey,
      character_name: resolved.characterName,
      avatar_url: resolved.avatarUrl || null,
      preview: resolved.preview,
      payload_json: {
        preview: resolved.preview,
        characterKey: resolved.characterKey,
        characterName: resolved.characterName,
        avatarUrl: resolved.avatarUrl,
        entries: resolved.entries,
        editorEntries: resolved.editorEntries,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId)
    .eq("owner_id", guestId)
    .eq("is_deleted", false);

  if (error) {
    throw new Error(error.message);
  }

revalidateMakerMessagePaths(threadId);
redirect("/maker/messages?saved=1");
}

export async function softDeleteMakerMessage(formData: FormData) {
  const { guestId } = await ensureMakerGuest();
  const threadId = normalizeText(formData.get("threadId"));

  if (!threadId) {
    throw new Error("threadId가 없습니다.");
  }

  const { error } = await supabaseAdmin
    .from("maker_message_threads")
    .update({
      is_deleted: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId)
    .eq("owner_id", guestId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateMakerMessagePaths(threadId);
  redirect("/maker/messages");
}

export async function cloneMakerMessageThread(formData: FormData) {
  const threadId = String(formData.get("threadId") || "").trim();
  if (!threadId) {
    throw new Error("threadId가 없습니다.");
  }

  const { guestId } = await ensureMakerGuest();

  const { data: source, error: sourceError } = await supabaseAdmin
    .from("maker_message_threads")
    .select(
      "id, owner_id, title, character_key, character_name, avatar_url, preview, payload_json, is_deleted"
    )
    .eq("id", threadId)
    .eq("owner_id", MAKER_EXAMPLE_OWNER_ID)
    .eq("is_deleted", false)
    .maybeSingle();

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  if (!source) {
    throw new Error("복사할 예시 메시지를 찾지 못했습니다.");
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("maker_message_threads")
    .insert({
      owner_id: guestId,
      title: source.title,
      character_key: source.character_key,
      character_name: source.character_name,
      avatar_url: source.avatar_url,
      preview: source.preview,
      payload_json: source.payload_json,
      is_deleted: false,
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidateMakerMessagePaths(inserted.id);
  redirect(`/maker/messages/${inserted.id}/edit`);
}