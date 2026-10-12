import { NextResponse } from "next/server";
import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isAdmin } from "@/lib/utils/admin-auth";
import {
  stableVariantId,
  stripVariantMarker,
} from "@/lib/media/r2-variant-path";

export const runtime = "nodejs";

const MAX_VARIANT_SIZE = 15 * 1024 * 1024;

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} 환경변수가 없습니다.`);
  }

  return value;
}

function publicObjectUrl(baseUrl: string, key: string) {
  const base = baseUrl.replace(/\/+$/, "");
  const encoded = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${base}/${encoded}`;
}

export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const sourceUrl = stripVariantMarker(
      String(body?.sourceUrl || "").trim()
    );
    const variant = String(body?.variant || "").trim();
    const fileSize = Number(body?.fileSize || 0);
    const contentType = String(
      body?.contentType || "image/webp"
    ).trim();

    if (!/^https?:\/\//i.test(sourceUrl)) {
      return NextResponse.json(
        { error: "원본 이미지 URL이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (variant !== "display" && variant !== "thumb") {
      return NextResponse.json(
        { error: "잘못된 파생 이미지 종류입니다." },
        { status: 400 }
      );
    }

    if (contentType !== "image/webp") {
      return NextResponse.json(
        { error: "파생 이미지는 WEBP만 허용합니다." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_VARIANT_SIZE
    ) {
      return NextResponse.json(
        { error: "파생 이미지 크기가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const publicBaseUrl = requiredEnv("R2_PUBLIC_BASE_URL");
    const normalizedBase = publicBaseUrl.replace(/\/+$/, "");

    if (!sourceUrl.startsWith(normalizedBase + "/")) {
      return NextResponse.json(
        { error: "현재 R2 버킷의 이미지가 아닙니다." },
        { status: 400 }
      );
    }

    const accountId = requiredEnv("R2_ACCOUNT_ID");
    const accessKeyId = requiredEnv("R2_ACCESS_KEY_ID");
    const secretAccessKey = requiredEnv("R2_SECRET_ACCESS_KEY");
    const bucket = requiredEnv("R2_BUCKET_NAME");

    const id = stableVariantId(sourceUrl);
    const key = `.variants/${id}/${variant}.webp`;

    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
      { expiresIn: 600 }
    );

    return NextResponse.json({
      uploadUrl,
      publicUrl: publicObjectUrl(publicBaseUrl, key),
      objectKey: key,
      expiresIn: 600,
    });
  } catch (error) {
    console.error("[r2-variant-presign] fatal:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "파생 이미지 업로드 URL 생성에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
