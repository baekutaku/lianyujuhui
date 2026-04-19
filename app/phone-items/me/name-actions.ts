"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getPhoneProfileActor } from "@/lib/phone/get-phone-profile-actor";

const GUEST_NAME_COOKIE = "phone_guest_name";
const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24; // 24시간

function normalizeGuestName(value: string) {
  const trimmed = value.trim().slice(0, 20);
  return trimmed || "유연";
}

export async function setPhoneGuestName(rawName: string) {
  const actor = await getPhoneProfileActor();

  if (actor.needsGuestCookie) {
    throw new Error("게스트 쿠키가 없습니다. /phone-items/me/init을 먼저 거쳐야 합니다.");
  }

  const cookieStore = await cookies();
  const value = normalizeGuestName(rawName);

  cookieStore.set({
    name: GUEST_NAME_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
  });

  revalidatePath("/phone-items/me");
  revalidatePath("/phone-items/moments");
  return { ok: true };
}

export async function resetPhoneGuestName() {
  const actor = await getPhoneProfileActor();

  if (actor.needsGuestCookie) {
    throw new Error("게스트 쿠키가 없습니다. /phone-items/me/init을 먼저 거쳐야 합니다.");
  }

  const cookieStore = await cookies();

  cookieStore.set({
    name: GUEST_NAME_COOKIE,
    value: "유연",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
  });

  revalidatePath("/phone-items/me");
  revalidatePath("/phone-items/moments");
  return { ok: true };
}