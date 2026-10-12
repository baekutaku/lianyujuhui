import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";
import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const applyMode = process.argv.includes("--apply");

const limitArg = process.argv.find((value) =>
  value.startsWith("--limit=")
);

const limit = limitArg
  ? Math.max(1, Number(limitArg.split("=")[1]) || 1)
  : Infinity;

const PAGE_SIZE = 500;

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;

  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const index = line.indexOf("=");
    if (index < 0) continue;

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

function env(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} 환경변수가 없습니다.`);
  return value;
}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  process.env.SUPABASE_URL?.trim();

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL 환경변수가 없습니다.");
}

const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
const r2Base = env("R2_PUBLIC_BASE_URL").replace(/\/+$/, "");
const r2Bucket = env("R2_BUCKET_NAME");

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env("R2_ACCESS_KEY_ID"),
    secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
  },
});

function canonical(src) {
  const value = String(src || "")
    .trim()
    .replace(/&amp;/g, "&");

  if (!value) return "";

  try {
    const url = new URL(value);
    url.searchParams.delete("r2v");
    return url.toString();
  } catch {
    return value;
  }
}

function hashA(value) {
  let hash = 0x811c9dc5;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function hashB(value) {
  let hash = 0x9e3779b9;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i) + i;
    hash = Math.imul(hash, 0x85ebca6b);
    hash ^= hash >>> 13;
  }

  return hash >>> 0;
}

function idFor(src) {
  const value = canonical(src);

  return (
    hashA(value).toString(16).padStart(8, "0") +
    hashB(value).toString(16).padStart(8, "0")
  );
}

function publicUrl(key) {
  const encoded = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${r2Base}/${encoded}`;
}

function isExternalSource(source) {
  if (!/^https?:\/\//i.test(source)) return false;

  return !(
    source === r2Base ||
    source.startsWith(r2Base + "/")
  );
}

const sources = new Set();

function add(url) {
  const source = canonical(url);

  if (!source || !isExternalSource(source)) return;

  sources.add(source);
}

function addHtmlImageSources(html) {
  const text = String(html || "");
  if (!text) return;

  const imgRegex =
    /<img\b[^>]*?\bsrc\s*=\s*(["'])(https?:\/\/[^"']+)\1/gi;

  for (const match of text.matchAll(imgRegex)) {
    add(match[2]);
  }

  const markdownRegex =
    /!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/gi;

  for (const match of text.matchAll(markdownRegex)) {
    add(match[1]);
  }
}

async function fetchAll(table, columns) {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.warn(`[skip] ${table}: ${error.message}`);
      return rows;
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

async function collect() {
  const cards = await fetchAll(
    "cards",
    "thumbnail_url, cover_image_url"
  );

  for (const row of cards) {
    add(row.thumbnail_url);
    add(row.cover_image_url);
  }

  const cardImages = await fetchAll(
    "card_images",
    "url"
  );

  for (const row of cardImages) {
    add(row.url);
  }

  const illustrations = await fetchAll(
    "illustrations",
    "image_url"
  );

  for (const row of illustrations) {
    add(row.image_url);
  }

  const illustrationImages = await fetchAll(
    "illustration_images",
    "url"
  );

  for (const row of illustrationImages) {
    add(row.url);
  }

  const media = await fetchAll(
    "media_assets",
    "media_type, url, thumbnail_url"
  );

  for (const row of media) {
    if (row.media_type !== "image") continue;
    add(row.url);
    add(row.thumbnail_url);
  }

  const events = await fetchAll(
    "events",
    "thumbnail_url"
  );

  for (const row of events) {
    add(row.thumbnail_url);
  }

  /*
    Old script extracted *every* URL from translations.
    That incorrectly treated YouTube/page links as images.
    Only actual <img src> and Markdown image URLs belong here.
  */
  const translations = await fetchAll(
    "translations",
    "body, source_text"
  );

  for (const row of translations) {
    addHtmlImageSources(row.body);
    addHtmlImageSources(row.source_text);
  }
}

async function fetchReadySources() {
  const ready = new Set();

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("image_derivatives")
      .select("source_url")
      .eq("status", "ready")
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(
        `image_derivatives ready 조회 실패: ${error.message}`
      );
    }

    const page = data ?? [];

    for (const row of page) {
      const source = canonical(row.source_url);
      if (source) ready.add(source);
    }

    if (page.length < PAGE_SIZE) break;
  }

  return ready;
}

function buildDownloadCandidates(source) {
  const result = [];
  const seen = new Set();

  function push(value) {
    const clean = canonical(value);
    if (!clean || seen.has(clean)) return;
    seen.add(clean);
    result.push(clean);
  }

  push(source);

  try {
    const url = new URL(source);

    /*
      Old Tistory/Kakao URLs often contain expired credential/expires
      query parameters. The bare object path sometimes remains usable.
    */
    if (
      url.hostname === "blog.kakaocdn.net" &&
      (
        url.searchParams.has("credential") ||
        url.searchParams.has("expires") ||
        url.searchParams.has("signature")
      )
    ) {
      const bare = new URL(url.toString());
      bare.search = "";
      push(bare.toString());
    }

    /*
      Daum thumbnail wrappers carry the original image in `fname`.
      Try both the embedded URL and a wrapper rebuilt with a clean
      embedded URL if the old signed URL expired.
    */
    if (
      url.hostname === "img1.daumcdn.net" &&
      url.pathname.startsWith("/thumb/")
    ) {
      const fname = url.searchParams.get("fname");

      if (fname && /^https?:\/\//i.test(fname)) {
        push(fname);

        try {
          const inner = new URL(fname);

          if (inner.hostname === "blog.kakaocdn.net") {
            inner.search = "";
            push(inner.toString());

            const rebuilt = new URL(url.toString());
            rebuilt.searchParams.set("fname", inner.toString());
            push(rebuilt.toString());
          }
        } catch {
          // keep the original candidate only
        }
      }
    }
  } catch {
    // invalid URL is handled by fetch later
  }

  return result;
}

async function fetchCandidate(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
        Accept:
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Referer: "https://www.tistory.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType =
      response.headers
        .get("content-type")
        ?.split(";")[0]
        ?.trim()
        .toLowerCase() || "";

    if (
      contentType &&
      !contentType.startsWith("image/") &&
      contentType !== "application/octet-stream"
    ) {
      throw new Error(`NOT_IMAGE ${contentType}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length === 0) {
      throw new Error("EMPTY_RESPONSE");
    }

    /*
      Validate the bytes before we count the request as an image.
      This rejects HTML returned with a misleading content-type.
    */
    const metadata = await sharp(buffer, {
      animated: false,
      failOn: "none",
    }).metadata();

    if (!metadata.format) {
      throw new Error("UNSUPPORTED_IMAGE");
    }

    return {
      buffer,
      contentType:
        contentType || `image/${metadata.format}`,
      etag: response.headers.get("etag"),
      metadata,
      fetchedUrl: url,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function downloadImage(source) {
  const candidates = buildDownloadCandidates(source);
  const errors = [];

  for (const candidate of candidates) {
    try {
      return await fetchCandidate(candidate);
    } catch (error) {
      errors.push(
        `${candidate} => ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  throw new Error(errors.join(" | "));
}

async function mirrorOne(source) {
  const id = idFor(source);

  const mirrorKey = `.mirror/${id}/original`;
  const displayKey = `.variants/${id}/display.webp`;
  const thumbKey = `.variants/${id}/thumb.webp`;

  const {
    buffer,
    contentType,
    etag,
    metadata,
    fetchedUrl,
  } = await downloadImage(source);

  const image = sharp(buffer, {
    animated: false,
    failOn: "none",
  }).rotate();

  const [display, thumb] = await Promise.all([
    image
      .clone()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 84,
        effort: 4,
      })
      .toBuffer(),

    image
      .clone()
      .resize({
        width: 640,
        height: 640,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 78,
        effort: 4,
      })
      .toBuffer(),
  ]);

  await Promise.all([
    r2.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: mirrorKey,
        Body: buffer,
        ContentType: contentType,
        CacheControl:
          "public, max-age=31536000, immutable",
      })
    ),
    r2.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: displayKey,
        Body: display,
        ContentType: "image/webp",
        CacheControl:
          "public, max-age=31536000, immutable",
      })
    ),
    r2.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: thumbKey,
        Body: thumb,
        ContentType: "image/webp",
        CacheControl:
          "public, max-age=31536000, immutable",
      })
    ),
  ]);

  const row = {
    source_url: source,
    source_kind: "external",
    mirrored_original_url: publicUrl(mirrorKey),
    display_url: publicUrl(displayKey),
    thumb_url: publicUrl(thumbKey),
    status: "ready",
    content_type: contentType || null,
    width: metadata.width || null,
    height: metadata.height || null,
    original_bytes: buffer.length,
    display_bytes: display.length,
    thumb_bytes: thumb.length,
    source_etag: etag || null,
    last_error: null,
    last_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("image_derivatives")
    .upsert(row, {
      onConflict: "source_url",
    });

  if (error) {
    throw new Error(`registry: ${error.message}`);
  }

  return {
    ...row,
    fetchedUrl,
  };
}

async function markFailed(source, errorMessage) {
  const { error } = await supabase
    .from("image_derivatives")
    .upsert(
      {
        source_url: source,
        source_kind: "external",
        status: "failed",
        last_error: String(errorMessage).slice(0, 4000),
        last_checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "source_url",
      }
    );

  if (error) {
    console.error(
      "  registry failed 상태 저장 실패:",
      error.message
    );
  }
}

await collect();

const allSources = [...sources];
const existingReady = await fetchReadySources();

const pending = allSources
  .filter((source) => !existingReady.has(source))
  .slice(0, limit);

console.log("");
console.log(
  `${applyMode ? "APPLY" : "DRY RUN"}: 외부 이미지 source ${allSources.length}개`
);
console.log(`registry ready 전체: ${existingReady.size}개`);
console.log(`이번 처리 대상: ${pending.length}개`);
console.log("");
console.log(
  "콘텐츠 DB의 source URL은 변경하지 않습니다."
);
console.log(
  "번역 본문에서는 실제 <img src> / Markdown 이미지만 수집합니다."
);
console.log("");

if (!applyMode) {
  for (let index = 0; index < pending.length; index += 1) {
    console.log(
      `- ${index + 1}/${pending.length} ${pending[index]}`
    );
  }

  console.log("");
  console.log(
    "실제 적용: npm run images:mirror-external -- --apply"
  );

  process.exit(0);
}

let success = 0;
let failed = 0;

for (let index = 0; index < pending.length; index += 1) {
  const source = pending[index];

  console.log(
    `→ ${index + 1}/${pending.length} ${source}`
  );

  try {
    const row = await mirrorOne(source);

    success += 1;

    console.log(
      `  ✓ original=${Math.round(
        row.original_bytes / 1024
      )}KB display=${Math.round(
        row.display_bytes / 1024
      )}KB thumb=${Math.round(
        row.thumb_bytes / 1024
      )}KB`
    );

    if (row.fetchedUrl !== source) {
      console.log(`    recovered via: ${row.fetchedUrl}`);
    }
  } catch (error) {
    failed += 1;

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.error(`  ✗ ${message}`);

    await markFailed(source, message);
  }
}

console.log("");
console.log("=== 결과 ===");
console.log(`성공: ${success}`);
console.log(`실패: ${failed}`);
