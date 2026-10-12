import {
  canonicalImageSource,
  hasLegacyVariantMarker,
  isGeneratedDerivativeUrl,
  publicObjectUrl,
  stableImageSourceId,
  variantObjectKey,
  type ImageVariantKind,
} from "@/lib/media/image-source";

/*
  Compatibility layer for the earlier ?r2v=1 implementation.
  New code must keep source URLs clean and use image_derivatives.
*/

export type R2ImageVariant = ImageVariantKind;

export function stripVariantMarker(
  src: string | null | undefined
) {
  return canonicalImageSource(src);
}

export function hasVariantMarker(
  src: string | null | undefined
) {
  return hasLegacyVariantMarker(src);
}

export function markVariantReady(
  src: string | null | undefined
) {
  // Deprecated: never add implementation-state query params to content URLs.
  return canonicalImageSource(src);
}

export function stableVariantId(
  src: string | null | undefined
) {
  return stableImageSourceId(src);
}

export function r2VariantUrl(
  src: string | null | undefined,
  variant: R2ImageVariant,
  publicBaseUrl?: string
) {
  const source = canonicalImageSource(src);
  if (!source) return "";

  let base = String(publicBaseUrl || "").trim();

  if (!base) {
    const configured =
      typeof process !== "undefined"
        ? process.env.R2_PUBLIC_BASE_URL ||
          process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ||
          ""
        : "";

    base = String(configured).trim();
  }

  if (!base) {
    try {
      base = new URL(source).origin;
    } catch {
      return "";
    }
  }

  return publicObjectUrl(base, variantObjectKey(source, variant));
}

export { isGeneratedDerivativeUrl as isGeneratedVariantUrl };
