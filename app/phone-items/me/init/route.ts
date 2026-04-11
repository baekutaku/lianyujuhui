import { NextResponse } from "next/server";
import { GUEST_COOKIE_NAME } from "@/lib/phone/get-phone-profile-actor";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectTo =
    url.searchParams.get("redirectTo")?.trim() || "/phone-items/me";

  const response = NextResponse.redirect(new URL(redirectTo, url));

  response.cookies.set(GUEST_COOKIE_NAME, crypto.randomUUID(), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}