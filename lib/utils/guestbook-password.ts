import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashGuestbookPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyGuestbookPassword(password: string, stored: string) {
  const [salt, originalHash] = stored.split(":");
  if (!salt || !originalHash) return false;

  const hashBuffer = Buffer.from(originalHash, "hex");
  const compareBuffer = scryptSync(password, salt, 64);

  if (hashBuffer.length !== compareBuffer.length) return false;
  return timingSafeEqual(hashBuffer, compareBuffer);
}