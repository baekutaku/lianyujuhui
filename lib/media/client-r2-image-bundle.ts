"use client";

import {
  canonicalImageSource,
} from "@/lib/media/image-source";

type UploadImageBundleOptions = {
  file: File;
  scope?: "cards" | "illustrations";
  presignEndpoint:
    | "/api/admin/r2/presign"
    | "/api/admin/r2/editor-presign";
};

type ImageBundleResult = {
  storedUrl: string;
  originalUrl: string;
  displayUrl?: string;
  thumbUrl?: string;
  variantsReady: boolean;
};

const DISPLAY_MAX_EDGE = 1600;
const THUMB_MAX_EDGE = 640;

async function putBlob(
  uploadUrl: string,
  blob: Blob,
  contentType: string
) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: blob,
  });

  if (!response.ok) {
    throw new Error(`R2 업로드 실패 (${response.status})`);
  }
}

async function requestOriginalPresign(
  options: UploadImageBundleOptions
) {
  const { file, scope, presignEndpoint } = options;

  const response = await fetch(presignEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
      ...(scope ? { scope } : {}),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error || `${file.name}: 업로드 준비에 실패했습니다.`
    );
  }

  return data as {
    uploadUrl: string;
    publicUrl: string;
  };
}

async function requestVariantPresign(params: {
  sourceUrl: string;
  variant: "display" | "thumb";
  fileSize: number;
}) {
  const response = await fetch(
    "/api/admin/r2/variant-presign",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceUrl: params.sourceUrl,
        variant: params.variant,
        fileSize: params.fileSize,
        contentType: "image/webp",
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `${params.variant} 파생 이미지 업로드 준비 실패`
    );
  }

  return data as {
    uploadUrl: string;
    publicUrl: string;
  };
}

async function registerDerivative(params: {
  sourceUrl: string;
  displayUrl: string;
  thumbUrl: string;
  file: File;
  width: number;
  height: number;
  displayBytes: number;
  thumbBytes: number;
}) {
  const response = await fetch(
    "/api/admin/r2/register-derivative",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceUrl: params.sourceUrl,
        mirroredOriginalUrl: params.sourceUrl,
        displayUrl: params.displayUrl,
        thumbUrl: params.thumbUrl,
        contentType: params.file.type,
        width: params.width,
        height: params.height,
        originalBytes: params.file.size,
        displayBytes: params.displayBytes,
        thumbBytes: params.thumbBytes,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error || "파생 이미지 registry 등록 실패"
    );
  }
}

async function loadBitmap(file: File) {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file, {
      imageOrientation: "from-image",
    });
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>(
      (resolve, reject) => {
        const element = new Image();

        element.onload = () => resolve(element);
        element.onerror = () =>
          reject(new Error("이미지를 읽을 수 없습니다."));

        element.src = objectUrl;
      }
    );

    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("WEBP 변환에 실패했습니다."));
      },
      "image/webp",
      quality
    );
  });
}

async function makeWebp(
  source: ImageBitmap | HTMLImageElement,
  sourceWidth: number,
  sourceHeight: number,
  maxEdge: number,
  quality: number
) {
  const scale = Math.min(
    1,
    maxEdge / Math.max(sourceWidth, sourceHeight)
  );

  const width = Math.max(
    1,
    Math.round(sourceWidth * scale)
  );

  const height = Math.max(
    1,
    Math.round(sourceHeight * scale)
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", {
    alpha: true,
  });

  if (!context) {
    throw new Error(
      "이미지 변환 canvas를 만들 수 없습니다."
    );
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, width, height);

  return {
    blob: await canvasToBlob(canvas, quality),
    width,
    height,
  };
}

export async function uploadImageBundle(
  options: UploadImageBundleOptions
): Promise<ImageBundleResult> {
  const { file } = options;

  const original = await requestOriginalPresign(options);

  await putBlob(
    original.uploadUrl,
    file,
    file.type || "application/octet-stream"
  );

  const originalUrl = canonicalImageSource(
    original.publicUrl
  );

  /*
    Animated GIFs keep the original untouched.
    We do not silently turn an animation into a still image.
  */
  if (file.type === "image/gif") {
    return {
      storedUrl: originalUrl,
      originalUrl,
      variantsReady: false,
    };
  }

  const source = await loadBitmap(file);

  try {
    const sourceWidth =
      "naturalWidth" in source
        ? source.naturalWidth
        : source.width;

    const sourceHeight =
      "naturalHeight" in source
        ? source.naturalHeight
        : source.height;

    const [display, thumb] = await Promise.all([
      makeWebp(
        source,
        sourceWidth,
        sourceHeight,
        DISPLAY_MAX_EDGE,
        0.84
      ),
      makeWebp(
        source,
        sourceWidth,
        sourceHeight,
        THUMB_MAX_EDGE,
        0.78
      ),
    ]);

    const [displayPresign, thumbPresign] =
      await Promise.all([
        requestVariantPresign({
          sourceUrl: originalUrl,
          variant: "display",
          fileSize: display.blob.size,
        }),
        requestVariantPresign({
          sourceUrl: originalUrl,
          variant: "thumb",
          fileSize: thumb.blob.size,
        }),
      ]);

    await Promise.all([
      putBlob(
        displayPresign.uploadUrl,
        display.blob,
        "image/webp"
      ),
      putBlob(
        thumbPresign.uploadUrl,
        thumb.blob,
        "image/webp"
      ),
    ]);

    await registerDerivative({
      sourceUrl: originalUrl,
      displayUrl: displayPresign.publicUrl,
      thumbUrl: thumbPresign.publicUrl,
      file,
      width: sourceWidth,
      height: sourceHeight,
      displayBytes: display.blob.size,
      thumbBytes: thumb.blob.size,
    });

    return {
      storedUrl: originalUrl,
      originalUrl,
      displayUrl: displayPresign.publicUrl,
      thumbUrl: thumbPresign.publicUrl,
      variantsReady: true,
    };
  } finally {
    if (
      "close" in source &&
      typeof source.close === "function"
    ) {
      source.close();
    }
  }
}
