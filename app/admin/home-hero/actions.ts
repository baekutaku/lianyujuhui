"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/utils/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type AddHeroInput = {
  imageUrl: string;
  sourceType: "external" | "r2";
  objectKey?: string | null;
};

async function requireHomeHeroAdmin() {
  const admin = await isAdmin();

  if (!admin) {
    throw new Error("관리자 권한이 필요합니다.");
  }
}

function revalidateHero() {
  revalidatePath("/");
  revalidatePath("/admin/home-hero");
}

export async function addHomeHeroImage(input: AddHeroInput) {
  await requireHomeHeroAdmin();

  const imageUrl = String(input.imageUrl || "").trim();

  if (!/^https?:\/\//i.test(imageUrl)) {
    throw new Error("올바른 이미지 URL이 아닙니다.");
  }

  const { data: last } = await supabaseAdmin
    .from("home_hero_images")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabaseAdmin
    .from("home_hero_images")
    .insert({
      image_url: imageUrl,
      source_type: input.sourceType,
      object_key:
        input.sourceType === "r2"
          ? String(input.objectKey || "").trim() || null
          : null,
      sort_order: Number(last?.sort_order ?? -1) + 1,
      is_active: true,
    })
    .select(
      "id, image_url, source_type, object_key, sort_order, is_active, created_at"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidateHero();

  return data;
}

export async function setHomeHeroActive(
  id: string,
  isActive: boolean
) {
  await requireHomeHeroAdmin();

  const { error } = await supabaseAdmin
    .from("home_hero_images")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateHero();
}

export async function reorderHomeHeroImages(ids: string[]) {
  await requireHomeHeroAdmin();

  for (let i = 0; i < ids.length; i += 1) {
    const { error } = await supabaseAdmin
      .from("home_hero_images")
      .update({
        sort_order: i,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ids[i]);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidateHero();
}

export async function deleteHomeHeroRecord(id: string) {
  await requireHomeHeroAdmin();

  const { data: row, error: findError } =
    await supabaseAdmin
      .from("home_hero_images")
      .select("id, source_type, object_key")
      .eq("id", id)
      .single();

  if (findError || !row) {
    throw new Error(
      findError?.message || "이미지를 찾지 못했습니다."
    );
  }

  const { error } = await supabaseAdmin
    .from("home_hero_images")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateHero();

  return {
    objectKey:
      row.source_type === "r2"
        ? row.object_key
        : null,
  };
}
