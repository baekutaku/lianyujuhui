import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isAdmin } from "@/lib/utils/admin-auth";

const ALLOWED_SCOPES = new Set(["cards", "illustrations"]);
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const MAX_FILE_SIZE = 30 * 1024 * 1024;

function env(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} 환경변수가 없습니다.`);
  return value;
}

function extensionFor(fileName: string, contentType: string) {
  const ext = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (ext && ext.length <= 8) return ext;

  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  };

  return map[contentType] || "bin";
}

function safeBaseName(fileName: string) {
  const withoutExt = fileName.replace(/\.[^.]+$/, "");
  const safe = withoutExt
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);

  return safe || "image";
}

function publicObjectUrl(baseUrl: string, key: string) {
  const base = baseUrl.replace(/\/+$/, "");
  const encodedKey = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${base}/${encodedKey}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "관리자 권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const fileName = String(body?.fileName || "").trim();
    const contentType = String(body?.contentType || "").trim().toLowerCase();
    const scope = String(body?.scope || "").trim().toLowerCase();
    const fileSize = Number(body?.fileSize || 0);

    if (!fileName) {
      return NextResponse.json({ error: "파일명이 없습니다." }, { status: 400 });
    }

    if (!ALLOWED_SCOPES.has(scope)) {
      return NextResponse.json({ error: "잘못된 업로드 분류입니다." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: "JPG, PNG, WEBP, GIF, AVIF 이미지만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일은 30MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const accountId = env("R2_ACCOUNT_ID");
    const accessKeyId = env("R2_ACCESS_KEY_ID");
    const secretAccessKey = env("R2_SECRET_ACCESS_KEY");
    const bucket = env("R2_BUCKET_NAME");
    const publicBaseUrl = env("R2_PUBLIC_BASE_URL");

    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const ext = extensionFor(fileName, contentType);
    const baseName = safeBaseName(fileName);
    const key = `${scope}/${year}/${month}/${crypto.randomUUID()}-${baseName}.${ext}`;

    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 });

    return NextResponse.json({
      uploadUrl,
      publicUrl: publicObjectUrl(publicBaseUrl, key),
      objectKey: key,
      expiresIn: 600,
    });
  } catch (error) {
    console.error("[r2-presign] fatal:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "업로드 URL 생성에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
