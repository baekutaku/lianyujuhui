import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { GUEST_COOKIE_NAME } from "@/lib/phone/get-phone-profile-actor";

const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24; // 24시간

function normalizeRedirectTo(value: string | null) {
  if (!value) return "/phone-items/me";
  if (!value.startsWith("/") || value.startsWith("//")) return "/phone-items/me";
  return value;
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const redirectTo = normalizeRedirectTo(
    request.nextUrl.searchParams.get("redirectTo")
  );

  let guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value?.trim();

  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  if (!guestId) {
    guestId = randomUUID();

    response.cookies.set({
      name: GUEST_COOKIE_NAME,
      value: guestId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GUEST_COOKIE_MAX_AGE,
    });
  }

  return response;
}