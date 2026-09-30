"use server";

import { redirect } from "next/navigation";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { supabase } from "@/lib/supabase/server";
import { grantStoryAccess } from "@/lib/utils/story-access";

function verifyPasswordRecord(password: string, stored: string | null | undefined) {
  if (!stored) return false;

  const [salt, savedHash] = stored.split(":");
  if (!salt || !savedHash) return false;

  const computedHash = scryptSync(password.trim(), salt, 64).toString("hex");

  const savedBuffer = Buffer.from(savedHash, "hex");
  const computedBuffer = Buffer.from(computedHash, "hex");

  if (savedBuffer.length !== computedBuffer.length) return false;

  return timingSafeEqual(savedBuffer, computedBuffer);
}

export async function unlockProtectedStory(formData: FormData) {
  const slug = String(formData.get("slug") || "").trim();
  const password = String(formData.get("password") || "").trim();

  if (!slug) {
    redirect("/stories");
  }

  if (!password) {
    redirect(`/stories/${encodeURIComponent(slug)}?passwordError=1`);
  }

  const { data: story } = await supabase
    .from("stories")
    .select("id, slug, visibility, access_password_hash")
    .eq("slug", slug)
    .maybeSingle();

  if (!story) {
    redirect("/stories");
  }

  if (story.visibility !== "protected" || !story.access_password_hash) {
    redirect(`/stories/${encodeURIComponent(story.slug)}`);
  }

  const ok = verifyPasswordRecord(password, story.access_password_hash);

  if (!ok) {
    redirect(`/stories/${encodeURIComponent(story.slug)}?passwordError=1`);
  }

  await grantStoryAccess(story.id, story.access_password_hash);

  redirect(`/stories/${encodeURIComponent(story.slug)}`);
}