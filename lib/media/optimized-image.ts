import {
  hasVariantMarker,
  isGeneratedVariantUrl,
  r2VariantUrl,
} from "@/lib/media/r2-variant-path";

export function optimizedImageUrl(
  src: string | null | undefined,
  width = 1200
) {
  const value = String(src || "").trim();

  if (!value) return "";

  if (isGeneratedVariantUrl(value)) {
    return value;
  }

  if (hasVariantMarker(value)) {
    const directVariant =
      width <= 700
        ? r2VariantUrl(value, "thumb")
        : r2VariantUrl(value, "display");

    if (directVariant) return directVariant;
  }

  if (value.startsWith("/_next/image?")) {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    return `/_next/image?url=${encodeURIComponent(value)}&w=${width}&q=75`;
  }

  return value;
}

export function optimizeHtmlImageSources(
  html: string,
  width = 1200
) {
  if (!html) return html;

  return html.replace(
    /(<img\b[^>]*?\bsrc\s*=\s*)(["'])(https?:\/\/[^"']+)\2/gi,
    (_match, prefix: string, quote: string, src: string) => {
      const optimized = optimizedImageUrl(src, width);
      return `${prefix}${quote}${optimized}${quote}`;
    }
  );
}
