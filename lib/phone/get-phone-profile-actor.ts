import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase/server";

export const GUEST_COOKIE_NAME = "phone_guest_id";

function parseEnvList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function getPhoneProfileActor() {
  const cookieStore = await cookies();
  const { data } = await supabase.auth.getUser();
  const user = data.user ?? null;

  const adminEmails = parseEnvList(process.env.PHONE_PROFILE_ADMIN_EMAILS);
  const adminIds = parseEnvList(process.env.PHONE_PROFILE_ADMIN_IDS);

  // admin_auth 쿠키로 로그인한 관리자 체크
  const adminAuth = cookieStore.get("admin_auth")?.value?.trim();
  const isCookieAdmin = adminAuth === "ok";

  if (user) {
    const isAdmin =
      isCookieAdmin ||
      (user.email ? adminEmails.includes(user.email) : false) ||
      adminIds.includes(user.id);

    return {
      ownerType: "user" as const,
      ownerId: user.id,
      isAdmin,
      user,
      needsGuestCookie: false,
    };
  }

  const guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value?.trim() || null;

  return {
    ownerType: "guest" as const,
    ownerId: guestId,
    isAdmin: isCookieAdmin,  // ← admin_auth 쿠키 있으면 관리자
    user: null,
    needsGuestCookie: !guestId,
  };
}

export async function requirePhoneProfileAdmin() {
  const actor = await getPhoneProfileActor();

  if (!actor.isAdmin) {
    throw new Error("관리자 권한이 없습니다.");
  }

  return actor;
}