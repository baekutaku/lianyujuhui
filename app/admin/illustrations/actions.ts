"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/utils/admin-auth";
import { getAdminSupabase } from "@/lib/supabase/admin";

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("관리자 권한이 없습니다.");
}
function optionalText(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}
function optionalInt(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) throw new Error("연도가 올바르지 않습니다.");
  return Math.trunc(parsed);
}

function parseIllustrationImages(formData: FormData) {
  const raw = String(formData.get("imageUrlsJson") || "[]").trim();
  const fallback = String(formData.get("imageUrl") || "").trim();
  const requestedPrimary = String(
    formData.get("primaryImageUrl") || fallback
  ).trim();

  let parsed: unknown = [];

  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = [];
  }

  const imageUrls = Array.from(
    new Set(
      (Array.isArray(parsed) ? parsed : [])
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );

  if (fallback && !imageUrls.includes(fallback)) {
    imageUrls.unshift(fallback);
  }

  const primaryImageUrl =
    requestedPrimary && imageUrls.includes(requestedPrimary)
      ? requestedPrimary
      : imageUrls[0] || "";

  return { imageUrls, primaryImageUrl };
}

async function syncIllustrationImages(
  illustrationId: string,
  imageUrls: string[],
  primaryImageUrl: string
) {
  const supabase = getAdminSupabase();

  const { error: deleteError } = await supabase
    .from("illustration_images")
    .delete()
    .eq("illustration_id", illustrationId);

  if (deleteError) throw new Error(deleteError.message);

  if (imageUrls.length === 0) return;

  const { error: insertError } = await supabase
    .from("illustration_images")
    .insert(
      imageUrls.map((url, index) => ({
        illustration_id: illustrationId,
        url,
        sort_order: index,
        is_primary: url === primaryImageUrl,
      }))
    );

  if (insertError) throw new Error(insertError.message);
}

async function resolveForeignKeys(serverKey: string | null, characterKey: string | null) {
  const supabase = getAdminSupabase();
  let serverId: string | null = null;
  let characterId: string | null = null;
  if (serverKey) {
    const { data, error } = await supabase.from("servers").select("id").eq("key", serverKey).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error(`서버를 찾을 수 없습니다: ${serverKey}`);
    serverId = data.id;
  }
  if (characterKey) {
    const { data, error } = await supabase.from("characters").select("id").eq("key", characterKey).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error(`캐릭터를 찾을 수 없습니다: ${characterKey}`);
    characterId = data.id;
  }
  return { serverId, characterId };
}

export async function createIllustration(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const { imageUrls, primaryImageUrl } = parseIllustrationImages(formData);

  if (!title) throw new Error("제목이 비어 있습니다.");
  if (!primaryImageUrl) throw new Error("대표 이미지를 선택해 주세요.");

  const serverKey = optionalText(formData.get("serverKey"));
  const characterKey = optionalText(formData.get("characterKey"));
  const { serverId, characterId } = await resolveForeignKeys(
    serverKey,
    characterKey
  );

  const supabase = getAdminSupabase();

  const { data: inserted, error } = await supabase
    .from("illustrations")
    .insert({
      title,
      image_url: primaryImageUrl,
      summary: optionalText(formData.get("summary")),
      release_year: optionalInt(formData.get("releaseYear")),
      release_date: optionalText(formData.get("releaseDate")),
      source_url: optionalText(formData.get("sourceUrl")),
      server_id: serverId,
      primary_character_id: characterId,
      is_published: formData.get("isPublished") === "on",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "일러스트 저장에 실패했습니다.");
  }

  try {
    await syncIllustrationImages(
      inserted.id,
      imageUrls,
      primaryImageUrl
    );
  } catch (imageError) {
    await supabase.from("illustrations").delete().eq("id", inserted.id);
    throw imageError;
  }

  revalidatePath("/cards");
  revalidatePath("/admin/cards");
  redirect("/admin/cards?type=illustration");
}


export async function updateIllustration(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const { imageUrls, primaryImageUrl } = parseIllustrationImages(formData);

  if (!id) throw new Error("일러스트 id가 없습니다.");
  if (!title) throw new Error("제목이 비어 있습니다.");
  if (!primaryImageUrl) throw new Error("대표 이미지를 선택해 주세요.");

  const serverKey = optionalText(formData.get("serverKey"));
  const characterKey = optionalText(formData.get("characterKey"));
  const { serverId, characterId } = await resolveForeignKeys(
    serverKey,
    characterKey
  );

  const supabase = getAdminSupabase();

  const { error } = await supabase
    .from("illustrations")
    .update({
      title,
      image_url: primaryImageUrl,
      summary: optionalText(formData.get("summary")),
      release_year: optionalInt(formData.get("releaseYear")),
      release_date: optionalText(formData.get("releaseDate")),
      source_url: optionalText(formData.get("sourceUrl")),
      server_id: serverId,
      primary_character_id: characterId,
      is_published: formData.get("isPublished") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await syncIllustrationImages(id, imageUrls, primaryImageUrl);

  revalidatePath("/cards");
  revalidatePath("/admin/cards");
  redirect("/admin/cards?type=illustration");
}


export async function deleteIllustration(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("삭제할 일러스트 id가 없습니다.");
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("illustrations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/cards"); revalidatePath("/admin/cards");
  redirect("/admin/cards?type=illustration");
}
