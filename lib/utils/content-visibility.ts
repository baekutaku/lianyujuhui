import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type StoryVisibility = "public" | "protected" | "private";

export function normalizeStoryVisibility(value: string): StoryVisibility {
  if (value === "protected") return "protected";
  if (value === "private") return "private";
  return "public";
}

export function createPasswordRecord(password: string) {
  const trimmed = password.trim();

  if (!trimmed) {
    throw new Error("비밀번호가 비어 있습니다.");
  }

  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(trimmed, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPasswordRecord(password: string, stored: string | null | undefined) {
  if (!stored) return false;

  const [salt, savedHash] = stored.split(":");
  if (!salt || !savedHash) return false;

  const computedHash = scryptSync(password.trim(), salt, 64).toString("hex");

  const savedBuffer = Buffer.from(savedHash, "hex");
  const computedBuffer = Buffer.from(computedHash, "hex");

  if (savedBuffer.length !== computedBuffer.length) return false;

  return timingSafeEqual(savedBuffer, computedBuffer);
}