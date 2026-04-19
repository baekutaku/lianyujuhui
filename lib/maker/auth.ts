import { cookies } from "next/headers";
import { MAKER_GUEST_ID_COOKIE, MAKER_GUEST_NAME_COOKIE, MAKER_DEFAULT_MY_NAME } from "@/lib/maker/defaults";

function createGuestId() {
  return `maker-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getMakerActor() {
  const cookieStore = await cookies();

  const guestId = cookieStore.get(MAKER_GUEST_ID_COOKIE)?.value?.trim() || "";
  const guestName =
    cookieStore.get(MAKER_GUEST_NAME_COOKIE)?.value?.trim() || MAKER_DEFAULT_MY_NAME;

  return {
    ownerType: "guest" as const,
    ownerId: guestId,
    guestName,
    needsInit: !guestId,
  };
}

export async function ensureMakerGuest() {
  const cookieStore = await cookies();

  let guestId = cookieStore.get(MAKER_GUEST_ID_COOKIE)?.value?.trim() || "";
  let guestName = cookieStore.get(MAKER_GUEST_NAME_COOKIE)?.value?.trim() || "";

  if (!guestId) {
    guestId = createGuestId();
    cookieStore.set(MAKER_GUEST_ID_COOKIE, guestId, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }

  if (!guestName) {
    guestName = MAKER_DEFAULT_MY_NAME;
    cookieStore.set(MAKER_GUEST_NAME_COOKIE, guestName, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }

  return { guestId, guestName };
}