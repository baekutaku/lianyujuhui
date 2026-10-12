"use client";

import {
  markVariantReady,
  stripVariantMarker,
} from "@/lib/media/r2-variant-path";

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
  const response = await fetch("/api/admin/r2/variant-presign", {
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
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error || `${params.variant} 파생 이미지 업로드 준비 실패`
    );
  }

  return data as {
    uploadUrl: string;
    publicUrl: string;
  };
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
  file: File,
  maxEdge: number,
  quality: number
) {
  const source = await loadBitmap(file);

  const sourceWidth =
    "naturalWidth" in source ? source.naturalWidth : source.width;
  const sourceHeight =
    "naturalHeight" in source ? source.naturalHeight : source.height;

  const scale = Math.min(
    1,
    maxEdge / Math.max(sourceWidth, sourceHeight)
  );

  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", {
    alpha: true,
  });

  if (!context) {
    throw new Error("이미지 변환 canvas를 만들 수 없습니다.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, width, height);

  if ("close" in source && typeof source.close === "function") {
    source.close();
  }

  return canvasToBlob(canvas, quality);
}

function supportsStaticVariants(file: File) {
  /*
    GIF는 애니메이션 손실을 피하기 위해 원본 유지.
    SVG도 이 업로더의 허용 형식이 아니므로 제외.
  */
  return file.type !== "image/gif";
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

  const originalUrl = stripVariantMarker(original.publicUrl);

  if (!supportsStaticVariants(file)) {
    return {
      storedUrl: originalUrl,
      originalUrl,
      variantsReady: false,
    };
  }

  try {
    const [displayBlob, thumbBlob] = await Promise.all([
      makeWebp(file, DISPLAY_MAX_EDGE, 0.84),
      makeWebp(file, THUMB_MAX_EDGE, 0.78),
    ]);

    const [displayPresign, thumbPresign] = await Promise.all([
      requestVariantPresign({
        sourceUrl: originalUrl,
        variant: "display",
        fileSize: displayBlob.size,
      }),
      requestVariantPresign({
        sourceUrl: originalUrl,
        variant: "thumb",
        fileSize: thumbBlob.size,
      }),
    ]);

    await Promise.all([
      putBlob(
        displayPresign.uploadUrl,
        displayBlob,
        "image/webp"
      ),
      putBlob(
        thumbPresign.uploadUrl,
        thumbBlob,
        "image/webp"
      ),
    ]);

    return {
      storedUrl: markVariantReady(originalUrl),
      originalUrl,
      displayUrl: displayPresign.publicUrl,
      thumbUrl: thumbPresign.publicUrl,
      variantsReady: true,
    };
  } catch (error) {
    /*
      원본 업로드까지는 성공했으므로 등록 자체를 막지는 않는다.
      marker를 붙이지 않아 공개 페이지가 기존 Next 최적화 fallback을 사용한다.
    */
    console.error("[r2-image-bundle] variant generation failed", error);

    return {
      storedUrl: originalUrl,
      originalUrl,
      variantsReady: false,
    };
  }
}
