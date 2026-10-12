import {
  canonicalImageSource,
  isGeneratedDerivativeUrl,
  publicObjectUrl,
  variantObjectKey,
} from "@/lib/media/image-source";

function configuredR2Base() {
  if (typeof process === "undefined") return "";

  return String(
    process.env.R2_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ||
      ""
  )
    .trim()
    .replace(/\/+$/, "");
}

function isOwnR2Source(src: string) {
  const base = configuredR2Base();

  return Boolean(
    base &&
      (src === base || src.startsWith(base + "/"))
  );
}

export function optimizedImageUrl(
  src: string | null | undefined,
  width = 1200
) {
  const value = canonicalImageSource(src);

  if (!value) return "";

  if (isGeneratedDerivativeUrl(value)) {
    return value;
  }

  /*
    Our own R2 uploads have deterministic derivatives.
    This path does not need a DB lookup and avoids Vercel
    Image Optimization for archive-owned files.
  */
  if (isOwnR2Source(value)) {
    const variant = width <= 700 ? "thumb" : "display";

    return publicObjectUrl(
      configuredR2Base(),
      variantObjectKey(value, variant)
    );
  }

  if (value.startsWith("/_next/image?")) {
    return value;
  }

  /*
    External URLs are not rewritten to an R2 candidate blindly.
    Their mirrored/derived URLs are resolved through image_derivatives.
  */
  if (/^https?:\/\//i.test(value)) {
    return value;
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
    (
      _match,
      prefix: string,
      quote: string,
      src: string
    ) => {
      const optimized = optimizedImageUrl(src, width);
      return `${prefix}${quote}${optimized}${quote}`;
    }
  );
}
