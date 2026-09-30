"use server";

import { redirect } from "next/navigation";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { supabase } from "@/lib/supabase/server";
import { grantEventAccess } from "@/lib/utils/event-access";

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

export async function unlockProtectedEvent(formData: FormData) {
  const slug = String(formData.get("slug") || "").trim();
  const password = String(formData.get("password") || "").trim();

  if (!slug) {
    redirect("/events");
  }

  if (!password) {
    redirect(`/events/${encodeURIComponent(slug)}?passwordError=1`);
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, slug, visibility, access_password_hash")
    .eq("slug", slug)
    .maybeSingle();

  if (!event) {
    redirect("/events");
  }

  if (event.visibility !== "protected" || !event.access_password_hash) {
    redirect(`/events/${encodeURIComponent(event.slug)}`);
  }

  const ok = verifyPasswordRecord(password, event.access_password_hash);

  if (!ok) {
    redirect(`/events/${encodeURIComponent(event.slug)}?passwordError=1`);
  }

  await grantEventAccess(event.id, event.access_password_hash);

  redirect(`/events/${encodeURIComponent(event.slug)}`);
}