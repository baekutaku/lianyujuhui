import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

const COOKIE_PREFIX = "event_access_";

function makeCookieName(eventId: string) {
  return `${COOKIE_PREFIX}${eventId}`;
}

function sha256(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

export function makeEventAccessCookieValue(passwordHash: string) {
  return sha256(passwordHash);
}

export async function hasEventAccess(
  eventId: string,
  passwordHash: string | null | undefined
) {
  if (!passwordHash) return false;

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(makeCookieName(eventId))?.value;

  if (!cookieValue) return false;

  const expected = Buffer.from(makeEventAccessCookieValue(passwordHash), "hex");
  const actual = Buffer.from(cookieValue, "hex");

  if (expected.length !== actual.length) return false;

  return timingSafeEqual(expected, actual);
}

export async function grantEventAccess(eventId: string, passwordHash: string) {
  const cookieStore = await cookies();

  cookieStore.set(makeCookieName(eventId), makeEventAccessCookieValue(passwordHash), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/events",
    maxAge: 60 * 60 * 24 * 30,
  });
}