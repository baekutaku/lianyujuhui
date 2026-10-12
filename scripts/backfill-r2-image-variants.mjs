import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const applyMode = process.argv.includes("--apply");

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;

  const text = fs.readFileSync(file, "utf8");

  for (const rawLine of text.split(/\r?\n/)) {
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

    if (!process.env[key]) process.env[key] = value;
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
const r2AccountId = env("R2_ACCOUNT_ID");
const r2AccessKeyId = env("R2_ACCESS_KEY_ID");
const r2SecretAccessKey = env("R2_SECRET_ACCESS_KEY");
const r2Bucket = env("R2_BUCKET_NAME");
const r2Base = env("R2_PUBLIC_BASE_URL").replace(/\/+$/, "");

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
});

function stripMarker(src) {
  const value = String(src || "").trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    url.searchParams.delete("r2v");
    return url.toString();
  } catch {
    return value;
  }
}

function markReady(src) {
  const value = stripMarker(src);
  if (!value) return "";

  const url = new URL(value);
  url.searchParams.set("r2v", "1");
  return url.toString();
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

function stableId(src) {
  const value = stripMarker(src);
  const a = hashA(value).toString(16).padStart(8, "0");
  const b = hashB(value).toString(16).padStart(8, "0");
  return a + b;
}

function isR2Url(value) {
  const src = stripMarker(value);
  return src.startsWith(r2Base + "/");
}

function looksLikeImageUrl(value) {
  const src = stripMarker(value).toLowerCase();
  return /\.(?:jpe?g|png|webp|avif|gif)(?:$|\?)/i.test(src);
}

function objectKeyFromPublicUrl(value) {
  const original = new URL(stripMarker(value));
  const base = new URL(r2Base + "/");

  if (original.origin !== base.origin) {
    throw new Error(`R2 public origin 불일치: ${original.origin}`);
  }

  const basePath = base.pathname.replace(/^\/|\/$/g, "");
  let objectPath = original.pathname.replace(/^\/+/, "");

  if (basePath && objectPath.startsWith(basePath + "/")) {
    objectPath = objectPath.slice(basePath.length + 1);
  }

  return objectPath
    .split("/")
    .map((part) => decodeURIComponent(part))
    .join("/");
}

async function bodyToBuffer(body) {
  if (!body) throw new Error("R2 원본 body가 비어 있습니다.");

  if (typeof body.transformToByteArray === "function") {
    return Buffer.from(await body.transformToByteArray());
  }

  const chunks = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function makeVariants(originalUrl) {
  const objectKey = objectKeyFromPublicUrl(originalUrl);
  const id = stableId(originalUrl);

  const [head, object] = await Promise.all([
    r2.send(
      new HeadObjectCommand({
        Bucket: r2Bucket,
        Key: objectKey,
      })
    ),
    r2.send(
      new GetObjectCommand({
        Bucket: r2Bucket,
        Key: objectKey,
      })
    ),
  ]);

  const input = await bodyToBuffer(object.Body);

  const baseImage = sharp(input, {
    animated: false,
    failOn: "none",
  }).rotate();

  const [display, thumb] = await Promise.all([
    baseImage
      .clone()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 84, effort: 4 })
      .toBuffer(),

    baseImage
      .clone()
      .resize({
        width: 640,
        height: 640,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 78, effort: 4 })
      .toBuffer(),
  ]);

  if (applyMode) {
    await Promise.all([
      r2.send(
        new PutObjectCommand({
          Bucket: r2Bucket,
          Key: `.variants/${id}/display.webp`,
          Body: display,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        })
      ),
      r2.send(
        new PutObjectCommand({
          Bucket: r2Bucket,
          Key: `.variants/${id}/thumb.webp`,
          Body: thumb,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        })
      ),
    ]);
  }

  return {
    originalBytes: Number(head.ContentLength || input.length || 0),
    displayBytes: display.length,
    thumbBytes: thumb.length,
  };
}

const refs = new Map();

function addRef(url, update) {
  const raw = String(url || "").trim();

  if (!raw || !isR2Url(raw) || !looksLikeImageUrl(raw)) return;

  const original = stripMarker(raw);

  if (!refs.has(original)) {
    refs.set(original, { updates: [] });
  }

  refs.get(original).updates.push(update);
}

async function safeSelect(table, columns) {
  const { data, error } = await supabase.from(table).select(columns);

  if (error) {
    console.warn(`[skip] ${table}: ${error.message}`);
    return [];
  }

  return data ?? [];
}

async function checkedUpdate(label, queryPromise) {
  const { error } = await queryPromise;

  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
}

async function collectReferences() {
  const cards = await safeSelect(
    "cards",
    "id, thumbnail_url, cover_image_url"
  );

  for (const row of cards) {
    addRef(row.thumbnail_url, async (marked) => {
      await checkedUpdate(
        `cards.thumbnail_url ${row.id}`,
        supabase
          .from("cards")
          .update({ thumbnail_url: marked })
          .eq("id", row.id)
      );
    });

    addRef(row.cover_image_url, async (marked) => {
      await checkedUpdate(
        `cards.cover_image_url ${row.id}`,
        supabase
          .from("cards")
          .update({ cover_image_url: marked })
          .eq("id", row.id)
      );
    });
  }

  const cardImages = await safeSelect("card_images", "id, url");

  for (const row of cardImages) {
    addRef(row.url, async (marked) => {
      await checkedUpdate(
        `card_images.url ${row.id}`,
        supabase
          .from("card_images")
          .update({ url: marked })
          .eq("id", row.id)
      );
    });
  }

  const illustrations = await safeSelect(
    "illustrations",
    "id, image_url"
  );

  for (const row of illustrations) {
    addRef(row.image_url, async (marked) => {
      await checkedUpdate(
        `illustrations.image_url ${row.id}`,
        supabase
          .from("illustrations")
          .update({ image_url: marked })
          .eq("id", row.id)
      );
    });
  }

  const illustrationImages = await safeSelect(
    "illustration_images",
    "id, url"
  );

  for (const row of illustrationImages) {
    addRef(row.url, async (marked) => {
      await checkedUpdate(
        `illustration_images.url ${row.id}`,
        supabase
          .from("illustration_images")
          .update({ url: marked })
          .eq("id", row.id)
      );
    });
  }

  const media = await safeSelect(
    "media_assets",
    "id, url, thumbnail_url, media_type"
  );

  for (const row of media) {
    if (row.media_type !== "image") continue;

    addRef(row.url, async (marked) => {
      await checkedUpdate(
        `media_assets.url ${row.id}`,
        supabase
          .from("media_assets")
          .update({ url: marked })
          .eq("id", row.id)
      );
    });

    addRef(row.thumbnail_url, async (marked) => {
      await checkedUpdate(
        `media_assets.thumbnail_url ${row.id}`,
        supabase
          .from("media_assets")
          .update({ thumbnail_url: marked })
          .eq("id", row.id)
      );
    });
  }

  const events = await safeSelect("events", "id, thumbnail_url");

  for (const row of events) {
    addRef(row.thumbnail_url, async (marked) => {
      await checkedUpdate(
        `events.thumbnail_url ${row.id}`,
        supabase
          .from("events")
          .update({ thumbnail_url: marked })
          .eq("id", row.id)
      );
    });
  }

  const translations = await safeSelect(
    "translations",
    "id, body, source_text"
  );

  const urlPattern = /https?:\/\/[^"'<> \t\r\n]+/g;

  for (const row of translations) {
    for (const field of ["body", "source_text"]) {
      const text = String(row[field] || "");
      const matches = text.match(urlPattern) ?? [];

      for (const match of matches) {
        const cleaned = match.replace(/&amp;/g, "&");

        addRef(cleaned, async (marked) => {
          const current = String(row[field] || "");
          const next = current
            .split(cleaned)
            .join(marked)
            .split(cleaned.replace(/&/g, "&amp;"))
            .join(marked.replace(/&/g, "&amp;"));

          if (next === current) return;

          await checkedUpdate(
            `translations.${field} ${row.id}`,
            supabase
              .from("translations")
              .update({ [field]: next })
              .eq("id", row.id)
          );

          row[field] = next;
        });
      }
    }
  }
}

await collectReferences();

console.log("");
console.log(
  applyMode
    ? `R2 파생본 생성 + DB marker 적용: ${refs.size}개 원본`
    : `DRY RUN: 변환 대상 ${refs.size}개 원본`
);
console.log(
  applyMode
    ? "실제 R2/DB를 수정합니다."
    : "아직 아무것도 수정하지 않습니다. --apply를 붙이면 실제 적용됩니다."
);
console.log("");

let success = 0;
let failed = 0;
let originalBytesTotal = 0;
let displayBytesTotal = 0;
let thumbBytesTotal = 0;

let sequence = 0;

for (const [originalUrl, entry] of refs.entries()) {
  sequence += 1;

  console.log(`→ ${sequence}/${refs.size} 처리 시작`);
  console.log(`  ${originalUrl}`);

  try {
    const result = await makeVariants(originalUrl);

    originalBytesTotal += result.originalBytes;
    displayBytesTotal += result.displayBytes;
    thumbBytesTotal += result.thumbBytes;

    if (applyMode) {
      const marked = markReady(originalUrl);

      for (const update of entry.updates) {
        await update(marked);
      }
    }

    success += 1;

    console.log(
      `✓ ${sequence}/${refs.size}`,
      `original=${Math.round(result.originalBytes / 1024)}KB`,
      `display=${Math.round(result.displayBytes / 1024)}KB`,
      `thumb=${Math.round(result.thumbBytes / 1024)}KB`
    );
  } catch (error) {
    failed += 1;

    console.error(
      `✗ ${sequence}/${refs.size}`,
      error instanceof Error ? error.stack || error.message : error
    );
  }
}

console.log("");
console.log("=== 결과 ===");
console.log(`성공: ${success}`);
console.log(`실패: ${failed}`);
console.log(
  `원본 합계: ${(originalBytesTotal / 1024 / 1024).toFixed(1)} MB`
);
console.log(
  `상세용 합계: ${(displayBytesTotal / 1024 / 1024).toFixed(1)} MB`
);
console.log(
  `썸네일 합계: ${(thumbBytesTotal / 1024 / 1024).toFixed(1)} MB`
);

if (!applyMode) {
  console.log("");
  console.log("실제 적용: npm run images:backfill -- --apply");
}
