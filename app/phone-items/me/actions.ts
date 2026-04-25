"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getPhoneProfileActor,
  requirePhoneProfileAdmin,
} from "@/lib/phone/get-phone-profile-actor";
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

// ── 공통: 프로필 선택 저장 ──────────────────────────
export async function selectPhoneProfile(input: {
  sourceType: "option" | "custom";
  sourceId: string;
}) {
  const actor = await getPhoneProfileActor();
  const db = actor.ownerType === "guest" ? supabaseAdmin : supabase;

  const { error } = await db.from("phone_profile_selected").upsert(
    {
      owner_type: actor.ownerType,
      owner_id: actor.ownerId,
      source_type: input.sourceType,
      source_id: input.sourceId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_type,owner_id" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/phone-items/me");
  return { ok: true };
}

// ── 익명/유저: 내 커스텀 프로필 직접 추가 ───────────
export async function createCustomPhoneProfile(input: {
  title?: string;
  imageUrl: string;
}) {
  const actor = await getPhoneProfileActor();
  const imageUrl = normalizeImageUrl(input.imageUrl);
  const db = actor.ownerType === "guest" ? supabaseAdmin : supabase;

  const { data, error } = await db
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

  // 추가한 프로필을 바로 선택 상태로
  await db.from("phone_profile_selected").upsert(
    {
      owner_type: actor.ownerType,
      owner_id: actor.ownerId,
      source_type: "custom",
      source_id: data.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_type,owner_id" }
  );

  revalidatePath("/phone-items/me");
  return { ok: true, id: data.id };
}

// ── 익명/유저: 내 커스텀 프로필 삭제 ────────────────
export async function deactivateCustomPhoneProfile(id: string) {
  const actor = await getPhoneProfileActor();
  const db = actor.ownerType === "guest" ? supabaseAdmin : supabase;

  const { error } = await db
    .from("phone_profile_custom")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_type", actor.ownerType)
    .eq("owner_id", actor.ownerId);

  if (error) throw new Error(error.message);
  revalidatePath("/phone-items/me");
  return { ok: true };
}

// ── 익명/유저: 공유 커스텀 풀 → 내 커스텀으로 복사 ──
export async function cloneSharedProfileToCustom(input: {
  sharedOptionId: string;
}) {
  const actor = await getPhoneProfileActor();
  const db = actor.ownerType === "guest" ? supabaseAdmin : supabase;

  // 공유 풀 항목 조회
  const { data: shared, error: fetchError } = await supabase
    .from("phone_profile_options")
    .select("id, title, image_url")
    .eq("id", input.sharedOptionId)
    .eq("is_active", true)
    .eq("is_shared_custom", true)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!shared) throw new Error("공유 프로필을 찾을 수 없습니다.");

  // 중복 체크 (같은 image_url이 이미 내 커스텀에 있으면 차단)
  const { data: existing } = await db
    .from("phone_profile_custom")
    .select("id")
    .eq("owner_type", actor.ownerType)
    .eq("owner_id", actor.ownerId)
    .eq("image_url", shared.image_url)
    .eq("is_active", true)
    .maybeSingle();

  if (existing) throw new Error("이미 추가된 프로필입니다.");

  const { data, error } = await db
    .from("phone_profile_custom")
    .insert({
      owner_type: actor.ownerType,
      owner_id: actor.ownerId,
      title: shared.title,
      image_url: shared.image_url,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("프로필 추가에 실패했습니다.");

  // 복사한 프로필을 바로 선택 상태로
  await db.from("phone_profile_selected").upsert(
    {
      owner_type: actor.ownerType,
      owner_id: actor.ownerId,
      source_type: "custom",
      source_id: data.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_type,owner_id" }
  );

  revalidatePath("/phone-items/me");
  return { ok: true, id: data.id };
}

// ── 관리자: 기본 프로필(is_shared_custom=false) 추가 ─
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
    is_shared_custom: false,
    created_by_user_id: actor.user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/phone-items/me");
  return { ok: true };
}

// ── 관리자: 기본 프로필 수정 ─────────────────────────
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

// ── 관리자: 기본 프로필 삭제 ─────────────────────────
export async function deactivateBasePhoneProfileOption(id: string) {
  await requirePhoneProfileAdmin();

  const { error } = await supabase
    .from("phone_profile_options")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/phone-items/me");
  return { ok: true };
}

// ── 관리자: 공유 커스텀 풀(is_shared_custom=true) 추가
export async function createSharedCustomPhoneProfile(input: {
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
    is_shared_custom: true,
    created_by_user_id: actor.user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/phone-items/me");
  return { ok: true };
}

// ── 관리자: 공유 커스텀 풀 항목 삭제 ─────────────────
export async function deactivateSharedCustomPhoneProfile(id: string) {
  await requirePhoneProfileAdmin();

  const { error } = await supabase
    .from("phone_profile_options")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("is_shared_custom", true);

  if (error) throw new Error(error.message);
  revalidatePath("/phone-items/me");
  return { ok: true };
}