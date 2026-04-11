"use server";

import { revalidatePath } from "next/cache";
import { getPhoneProfileActor, requirePhoneProfileAdmin } from "@/lib/phone/get-phone-profile-actor";
import { supabase } from "@/lib/supabase/server";

function normalizeImageUrl(url: string) {
  const value = url.trim();
  if (!value) throw new Error("이미지 주소가 비어 있습니다.");

  if (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  throw new Error("이미지 주소는 / 또는 http(s)로 시작해야 합니다.");
}

export async function selectPhoneProfile(input: {
  sourceType: "option" | "custom";
  sourceId: string;
}) {
  const actor = await getPhoneProfileActor();

  const { error } = await supabase.from("phone_profile_selected").upsert(
    {
      owner_type: actor.ownerType,
      owner_id: actor.ownerId,
      source_type: input.sourceType,
      source_id: input.sourceId,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "owner_type,owner_id",
    }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/phone-items/me");
  return { ok: true };
}

export async function createCustomPhoneProfile(input: {
  title?: string;
  imageUrl: string;
}) {
  const actor = await getPhoneProfileActor();
  const imageUrl = normalizeImageUrl(input.imageUrl);

  const { data, error } = await supabase
    .from("phone_profile_custom")
    .insert({
      owner_type: actor.ownerType,
      owner_id: actor.ownerId,
      title: input.title?.trim() || null,
      image_url: imageUrl,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("커스텀 프로필 생성에 실패했습니다.");

  await supabase.from("phone_profile_selected").upsert(
    {
      owner_type: actor.ownerType,
      owner_id: actor.ownerId,
      source_type: "custom",
      source_id: data.id,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "owner_type,owner_id",
    }
  );

  revalidatePath("/phone-items/me");
  return { ok: true, id: data.id };
}

export async function deactivateCustomPhoneProfile(id: string) {
  const actor = await getPhoneProfileActor();

  const { error } = await supabase
    .from("phone_profile_custom")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("owner_type", actor.ownerType)
    .eq("owner_id", actor.ownerId);

  if (error) throw new Error(error.message);

  revalidatePath("/phone-items/me");
  return { ok: true };
}

export async function createBasePhoneProfileOption(input: {
  title?: string;
  imageUrl: string;
  sortOrder?: number;
}) {
  const actor = await requirePhoneProfileAdmin();
  const imageUrl = normalizeImageUrl(input.imageUrl);

  const { error } = await supabase.from("phone_profile_options").insert({
    title: input.title?.trim() || null,
    image_url: imageUrl,
    sort_order: input.sortOrder ?? 0,
    is_active: true,
    created_by_user_id: actor.user?.id ?? null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/phone-items/me");
  return { ok: true };
}

export async function updateBasePhoneProfileOption(input: {
  id: string;
  title?: string;
  imageUrl: string;
  sortOrder?: number;
}) {
  await requirePhoneProfileAdmin();
  const imageUrl = normalizeImageUrl(input.imageUrl);

  const { error } = await supabase
    .from("phone_profile_options")
    .update({
      title: input.title?.trim() || null,
      image_url: imageUrl,
      sort_order: input.sortOrder ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);

  revalidatePath("/phone-items/me");
  return { ok: true };
}

export async function deactivateBasePhoneProfileOption(id: string) {
  await requirePhoneProfileAdmin();

  const { error } = await supabase
    .from("phone_profile_options")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/phone-items/me");
  return { ok: true };
}