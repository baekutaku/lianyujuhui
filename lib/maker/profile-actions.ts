"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ensureMakerGuest } from "@/lib/maker/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  MAKER_DEFAULT_MY_NAME,
  MAKER_GUEST_NAME_COOKIE,
} from "@/lib/maker/defaults";

function revalidateMakerProfilePaths() {
  revalidatePath("/maker/me");
  revalidatePath("/maker/messages");
  revalidatePath("/maker/moments");
}

export async function updateMakerDisplayName(formData: FormData) {
  await ensureMakerGuest();

  const nextName =
    String(formData.get("displayName") || "").trim() || MAKER_DEFAULT_MY_NAME;

  const cookieStore = await cookies();
  cookieStore.set(MAKER_GUEST_NAME_COOKIE, nextName, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  revalidateMakerProfilePaths();
}

export async function selectMakerProfileImage(formData: FormData) {
  const { guestId } = await ensureMakerGuest();

  const sourceType = String(formData.get("sourceType") || "").trim();
  const sourceId = String(formData.get("sourceId") || "").trim();

  if ((sourceType !== "option" && sourceType !== "custom") || !sourceId) {
    throw new Error("프로필 선택 값이 올바르지 않습니다.");
  }

  await supabaseAdmin
    .from("phone_profile_selected")
    .delete()
    .eq("owner_type", "guest")
    .eq("owner_id", guestId);

  const { error } = await supabaseAdmin.from("phone_profile_selected").insert({
    owner_type: "guest",
    owner_id: guestId,
    source_type: sourceType,
    source_id: sourceId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateMakerProfilePaths();
}

export async function resetMakerProfileImage() {
  const { guestId } = await ensureMakerGuest();

  const { error } = await supabaseAdmin
    .from("phone_profile_selected")
    .delete()
    .eq("owner_type", "guest")
    .eq("owner_id", guestId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateMakerProfilePaths();
}

export async function addMakerCustomProfile(formData: FormData) {
  const { guestId } = await ensureMakerGuest();
  const imageUrl = String(formData.get("imageUrl") || "").trim();

  if (!imageUrl) {
    throw new Error("이미지 주소가 비어 있습니다.");
  }

  const { data, error } = await supabaseAdmin
    .from("phone_profile_custom")
    .insert({
      owner_type: "guest",
      owner_id: guestId,
      image_url: imageUrl,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "커스텀 프사 저장 실패");
  }

  await supabaseAdmin
    .from("phone_profile_selected")
    .delete()
    .eq("owner_type", "guest")
    .eq("owner_id", guestId);

  const { error: selectedError } = await supabaseAdmin
    .from("phone_profile_selected")
    .insert({
      owner_type: "guest",
      owner_id: guestId,
      source_type: "custom",
      source_id: data.id,
    });

  if (selectedError) {
    throw new Error(selectedError.message);
  }

  revalidateMakerProfilePaths();
}

export async function deleteMakerCustomProfile(formData: FormData) {
  const { guestId } = await ensureMakerGuest();
  const customId = String(formData.get("customId") || "").trim();

  if (!customId) {
    throw new Error("customId가 없습니다.");
  }

  const { data: selectedRow } = await supabaseAdmin
    .from("phone_profile_selected")
    .select("source_type, source_id")
    .eq("owner_type", "guest")
    .eq("owner_id", guestId)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from("phone_profile_custom")
    .update({ is_active: false })
    .eq("id", customId)
    .eq("owner_type", "guest")
    .eq("owner_id", guestId);

  if (error) {
    throw new Error(error.message);
  }

  if (
    selectedRow?.source_type === "custom" &&
    selectedRow?.source_id === customId
  ) {
    await supabaseAdmin
      .from("phone_profile_selected")
      .delete()
      .eq("owner_type", "guest")
      .eq("owner_id", guestId);
  }

  revalidateMakerProfilePaths();
}