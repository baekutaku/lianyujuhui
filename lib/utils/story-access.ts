import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

const COOKIE_PREFIX = "story_access_";

function makeCookieName(storyId: string) {
  return `${COOKIE_PREFIX}${storyId}`;
}

function sha256(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

export function makeStoryAccessCookieValue(passwordHash: string) {
  return sha256(passwordHash);
}

export async function hasStoryAccess(
  storyId: string,
  passwordHash: string | null | undefined
) {
  if (!passwordHash) return false;

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(makeCookieName(storyId))?.value;

  if (!cookieValue) return false;

  const expected = Buffer.from(makeStoryAccessCookieValue(passwordHash), "hex");
  const actual = Buffer.from(cookieValue, "hex");

  if (expected.length !== actual.length) return false;

  return timingSafeEqual(expected, actual);
}

export async function grantStoryAccess(storyId: string, passwordHash: string) {
  const cookieStore = await cookies();

  cookieStore.set(makeCookieName(storyId), makeStoryAccessCookieValue(passwordHash), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/stories",
    maxAge: 60 * 60 * 24 * 30,
  });
}