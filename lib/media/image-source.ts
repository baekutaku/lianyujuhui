export type ImageVariantKind = "display" | "thumb";

const LEGACY_MARKER = "r2v";

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

export function canonicalImageSource(
  src: string | null | undefined
) {
  const value = String(src || "")
    .trim()
    .replace(/&amp;/g, "&");

  if (!value) return "";

  try {
    const url = new URL(value);
    url.searchParams.delete(LEGACY_MARKER);
    return url.toString();
  } catch {
    return value;
  }
}

export function hasLegacyVariantMarker(
  src: string | null | undefined
) {
  const value = String(src || "").trim();
  if (!value) return false;

  try {
    return (
      new URL(value).searchParams.get(LEGACY_MARKER) === "1"
    );
  } catch {
    return false;
  }
}

export function stableImageSourceId(
  src: string | null | undefined
) {
  const value = canonicalImageSource(src);
  return `${hex32(hashA(value))}${hex32(hashB(value))}`;
}

export function variantObjectKey(
  src: string | null | undefined,
  variant: ImageVariantKind
) {
  return `.variants/${stableImageSourceId(src)}/${variant}.webp`;
}

export function mirrorObjectKey(
  src: string | null | undefined
) {
  return `.mirror/${stableImageSourceId(src)}/original`;
}

export function publicObjectUrl(
  publicBaseUrl: string,
  objectKey: string
) {
  const base = publicBaseUrl.replace(/\/+$/, "");

  const encoded = objectKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${base}/${encoded}`;
}

export function isGeneratedDerivativeUrl(
  src: string | null | undefined
) {
  const value = String(src || "").trim();
  if (!value) return false;

  try {
    const pathname = new URL(value).pathname;

    return (
      /\/\.variants\/[a-f0-9]{16}\/(?:display|thumb)\.webp$/i.test(
        pathname
      ) ||
      /\/\.mirror\/[a-f0-9]{16}\/original$/i.test(pathname)
    );
  } catch {
    return false;
  }
}
