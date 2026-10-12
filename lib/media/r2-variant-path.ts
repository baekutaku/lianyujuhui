export type R2ImageVariant = "display" | "thumb";

const VARIANT_MARKER = "r2v";

function hashA(value: string) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function hashB(value: string) {
  let hash = 0x9e3779b9;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index) + index;
    hash = Math.imul(hash, 0x85ebca6b);
    hash ^= hash >>> 13;
  }

  return hash >>> 0;
}

function hex32(value: number) {
  return value.toString(16).padStart(8, "0");
}

export function stripVariantMarker(
  src: string | null | undefined
) {
  const value = String(src || "").trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    url.searchParams.delete(VARIANT_MARKER);
    return url.toString();
  } catch {
    return value;
  }
}

export function hasVariantMarker(
  src: string | null | undefined
) {
  const value = String(src || "").trim();
  if (!value) return false;

  try {
    return new URL(value).searchParams.get(VARIANT_MARKER) === "1";
  } catch {
    return false;
  }
}

export function markVariantReady(
  src: string | null | undefined
) {
  const value = stripVariantMarker(src);
  if (!value) return "";

  try {
    const url = new URL(value);
    url.searchParams.set(VARIANT_MARKER, "1");
    return url.toString();
  } catch {
    return value;
  }
}

export function stableVariantId(
  src: string | null | undefined
) {
  const value = stripVariantMarker(src);
  return `${hex32(hashA(value))}${hex32(hashB(value))}`;
}

export function r2VariantUrl(
  src: string | null | undefined,
  variant: R2ImageVariant
) {
  const value = String(src || "").trim();
  if (!value || !hasVariantMarker(value)) return "";

  try {
    const original = new URL(stripVariantMarker(value));
    const id = stableVariantId(original.toString());

    original.pathname = `/.variants/${id}/${variant}.webp`;
    original.search = "";
    original.hash = "";

    return original.toString();
  } catch {
    return "";
  }
}

export function isGeneratedVariantUrl(
  src: string | null | undefined
) {
  const value = String(src || "").trim();
  if (!value) return false;

  try {
    return /\/\.variants\/[a-f0-9]{16}\/(?:display|thumb)\.webp$/i.test(
      new URL(value).pathname
    );
  } catch {
    return false;
  }
}
