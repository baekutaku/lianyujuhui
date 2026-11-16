import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isAdmin } from "@/lib/utils/admin-auth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

function env(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} 환경변수가 없습니다.`);
  return value;
}

function safeFileName(value: string) {
  return value.normalize("NFKC").replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "image";
}

function encodeKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const fileName = String(body?.fileName || "").trim();
    const contentType = String(body?.contentType || "").trim();
    const fileSize = Number(body?.fileSize || 0);

    if (!fileName) return NextResponse.json({ error: "파일명이 없습니다." }, { status: 400 });
    if (!ALLOWED.has(contentType)) return NextResponse.json({ error: "지원하지 않는 이미지 형식입니다." }, { status: 400 });
    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "이미지는 파일당 30MB 이하여야 합니다." }, { status: 400 });
    }

    const accountId = env("R2_ACCOUNT_ID");
    const accessKeyId = env("R2_ACCESS_KEY_ID");
    const secretAccessKey = env("R2_SECRET_ACCESS_KEY");
    const bucketName = env("R2_BUCKET_NAME");
    const publicBaseUrl = env("R2_PUBLIC_BASE_URL").replace(/\/+$/, "");

    const now = new Date();
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const objectKey = `editor/${yyyy}/${mm}/${randomUUID()}-${safeFileName(fileName)}`;

    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    const command = new PutObjectCommand({ Bucket: bucketName, Key: objectKey, ContentType: contentType });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 });
    const publicUrl = `${publicBaseUrl}/${encodeKey(objectKey)}`;

    return NextResponse.json({ uploadUrl, publicUrl, objectKey });
  } catch (error) {
    console.error("[editor-r2-presign] fatal error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "업로드 URL 생성 실패" }, { status: 500 });
  }
}
