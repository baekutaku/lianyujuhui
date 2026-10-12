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

  for (const rawLine of fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const index = line.indexOf("=");
    if (index < 0) continue;

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();

    if (
      (value.startsWith('"') &&
        value.endsWith('"')) ||
      (value.startsWith("'") &&
        value.endsWith("'"))
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

  if (!value) {
    throw new Error(
      `${name} 환경변수가 없습니다.`
    );
  }

  return value;
}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  process.env.SUPABASE_URL?.trim();

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL 환경변수가 없습니다."
  );
}

const serviceKey = env(
  "SUPABASE_SERVICE_ROLE_KEY"
);

const r2Base = env(
  "R2_PUBLIC_BASE_URL"
).replace(/\/+$/, "");

const r2Bucket = env("R2_BUCKET_NAME");

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env(
    "R2_ACCOUNT_ID"
  )}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env("R2_ACCESS_KEY_ID"),
    secretAccessKey: env(
      "R2_SECRET_ACCESS_KEY"
    ),
  },
});

const supabase = createClient(
  supabaseUrl,
  serviceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

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
    hashA(value)
      .toString(16)
      .padStart(8, "0") +
    hashB(value)
      .toString(16)
      .padStart(8, "0")
  );
}

function objectKeyFromPublicUrl(value) {
  const original = new URL(canonical(value));
  const base = new URL(r2Base + "/");

  if (original.origin !== base.origin) {
    throw new Error(
      `R2 public origin 불일치: ${original.origin}`
    );
  }

  const basePath = base.pathname.replace(
    /^\/|\/$/g,
    ""
  );

  let objectPath =
    original.pathname.replace(/^\/+/, "");

  if (
    basePath &&
    objectPath.startsWith(
      basePath + "/"
    )
  ) {
    objectPath = objectPath.slice(
      basePath.length + 1
    );
  }

  return objectPath
    .split("/")
    .map((part) => decodeURIComponent(part))
    .join("/");
}

function publicUrl(key) {
  const encoded = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${r2Base}/${encoded}`;
}

async function exists(key) {
  try {
    const head = await r2.send(
      new HeadObjectCommand({
        Bucket: r2Bucket,
        Key: key,
      })
    );

    return {
      exists: true,
      bytes: Number(
        head.ContentLength || 0
      ),
    };
  } catch (error) {
    const status =
      error?.$metadata?.httpStatusCode;

    if (
      status === 404 ||
      error?.name === "NotFound"
    ) {
      return {
        exists: false,
        bytes: 0,
      };
    }

    throw error;
  }
}

async function bodyToBuffer(body) {
  if (!body) {
    throw new Error(
      "R2 원본 body가 비어 있습니다."
    );
  }

  if (
    typeof body.transformToByteArray ===
    "function"
  ) {
    return Buffer.from(
      await body.transformToByteArray()
    );
  }

  const chunks = [];

  for await (const chunk of body) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function ensureVariants(sourceUrl) {
  const source = canonical(sourceUrl);
  const id = idFor(source);

  const displayKey =
    `.variants/${id}/display.webp`;

  const thumbKey =
    `.variants/${id}/thumb.webp`;

  const [displayHead, thumbHead] =
    await Promise.all([
      exists(displayKey),
      exists(thumbKey),
    ]);

  if (
    displayHead.exists &&
    thumbHead.exists
  ) {
    const sourceHead = await r2.send(
      new HeadObjectCommand({
        Bucket: r2Bucket,
        Key: objectKeyFromPublicUrl(source),
      })
    );

    return {
      displayUrl: publicUrl(displayKey),
      thumbUrl: publicUrl(thumbKey),
      originalBytes: Number(
        sourceHead.ContentLength || 0
      ),
      displayBytes: displayHead.bytes,
      thumbBytes: thumbHead.bytes,
    };
  }

  if (!applyMode) {
    return {
      missing: true,
      displayUrl: publicUrl(displayKey),
      thumbUrl: publicUrl(thumbKey),
    };
  }

  const sourceKey =
    objectKeyFromPublicUrl(source);

  const object = await r2.send(
    new GetObjectCommand({
      Bucket: r2Bucket,
      Key: sourceKey,
    })
  );

  const input = await bodyToBuffer(
    object.Body
  );

  const image = sharp(input, {
    animated: false,
    failOn: "none",
  }).rotate();

  const [metadata, display, thumb] =
    await Promise.all([
      image.clone().metadata(),
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

  return {
    displayUrl: publicUrl(displayKey),
    thumbUrl: publicUrl(thumbKey),
    originalBytes: input.length,
    displayBytes: display.length,
    thumbBytes: thumb.length,
    width: metadata.width || null,
    height: metadata.height || null,
    contentType: object.ContentType || null,
    sourceEtag: object.ETag || null,
  };
}

const refs = new Map();

function addRef(url, updater) {
  const raw = String(url || "").trim();
  if (!raw) return;

  const clean = canonical(raw);

  if (
    !clean.startsWith(r2Base + "/")
  ) {
    return;
  }

  if (
    /\/\.(?:variants|mirror)\//.test(
      new URL(clean).pathname
    )
  ) {
    return;
  }

  if (!refs.has(clean)) {
    refs.set(clean, {
      rawValues: new Set(),
      updaters: [],
    });
  }

  refs.get(clean).rawValues.add(raw);

  if (updater) {
    refs.get(clean).updaters.push(
      updater
    );
  }
}

async function safeSelect(table, columns) {
  const { data, error } = await supabase
    .from(table)
    .select(columns);

  if (error) {
    console.warn(
      `[skip] ${table}: ${error.message}`
    );
    return [];
  }

  return data ?? [];
}

async function checkedUpdate(
  label,
  queryPromise
) {
  const { error } = await queryPromise;

  if (error) {
    throw new Error(
      `${label}: ${error.message}`
    );
  }
}

async function collect() {
  const cards = await safeSelect(
    "cards",
    "id, thumbnail_url, cover_image_url"
  );

  for (const row of cards) {
    addRef(
      row.thumbnail_url,
      async (clean) =>
        checkedUpdate(
          `cards.thumbnail_url ${row.id}`,
          supabase
            .from("cards")
            .update({
              thumbnail_url: clean,
            })
            .eq("id", row.id)
        )
    );

    addRef(
      row.cover_image_url,
      async (clean) =>
        checkedUpdate(
          `cards.cover_image_url ${row.id}`,
          supabase
            .from("cards")
            .update({
              cover_image_url: clean,
            })
            .eq("id", row.id)
        )
    );
  }

  const cardImages = await safeSelect(
    "card_images",
    "id, url"
  );

  for (const row of cardImages) {
    addRef(
      row.url,
      async (clean) =>
        checkedUpdate(
          `card_images.url ${row.id}`,
          supabase
            .from("card_images")
            .update({ url: clean })
            .eq("id", row.id)
        )
    );
  }

  const illustrations =
    await safeSelect(
      "illustrations",
      "id, image_url"
    );

  for (const row of illustrations) {
    addRef(
      row.image_url,
      async (clean) =>
        checkedUpdate(
          `illustrations.image_url ${row.id}`,
          supabase
            .from("illustrations")
            .update({
              image_url: clean,
            })
            .eq("id", row.id)
        )
    );
  }

  const illustrationImages =
    await safeSelect(
      "illustration_images",
      "id, url"
    );

  for (const row of illustrationImages) {
    addRef(
      row.url,
      async (clean) =>
        checkedUpdate(
          `illustration_images.url ${row.id}`,
          supabase
            .from("illustration_images")
            .update({ url: clean })
            .eq("id", row.id)
        )
    );
  }

  const media = await safeSelect(
    "media_assets",
    "id, media_type, url, thumbnail_url"
  );

  for (const row of media) {
    if (row.media_type !== "image") continue;

    addRef(
      row.url,
      async (clean) =>
        checkedUpdate(
          `media_assets.url ${row.id}`,
          supabase
            .from("media_assets")
            .update({ url: clean })
            .eq("id", row.id)
        )
    );

    addRef(
      row.thumbnail_url,
      async (clean) =>
        checkedUpdate(
          `media_assets.thumbnail_url ${row.id}`,
          supabase
            .from("media_assets")
            .update({
              thumbnail_url: clean,
            })
            .eq("id", row.id)
        )
    );
  }

  const events = await safeSelect(
    "events",
    "id, thumbnail_url"
  );

  for (const row of events) {
    addRef(
      row.thumbnail_url,
      async (clean) =>
        checkedUpdate(
          `events.thumbnail_url ${row.id}`,
          supabase
            .from("events")
            .update({
              thumbnail_url: clean,
            })
            .eq("id", row.id)
        )
    );
  }
}

await collect();

console.log("");
console.log(
  `${applyMode ? "APPLY" : "DRY RUN"}: R2 source ${refs.size}개`
);
console.log(
  "콘텐츠 URL에는 원본 source URL만 남기고, 파생본은 image_derivatives에 등록합니다."
);
console.log("");

let ready = 0;
let generated = 0;
let failed = 0;

let index = 0;

for (const [source, entry] of refs) {
  index += 1;

  console.log(
    `→ ${index}/${refs.size} ${source}`
  );

  try {
    const result =
      await ensureVariants(source);

    if (result.missing) {
      console.log(
        "  - 파생본 없음 (실제 적용 시 생성)"
      );
      continue;
    }

    if (
      applyMode &&
      result.displayBytes &&
      result.thumbBytes
    ) {
      const { error } = await supabase
        .from("image_derivatives")
        .upsert(
          {
            source_url: source,
            source_kind: "legacy_r2",
            mirrored_original_url:
              source,
            display_url:
              result.displayUrl,
            thumb_url:
              result.thumbUrl,
            status: "ready",
            content_type:
              result.contentType || null,
            width:
              result.width || null,
            height:
              result.height || null,
            original_bytes:
              result.originalBytes || null,
            display_bytes:
              result.displayBytes || null,
            thumb_bytes:
              result.thumbBytes || null,
            source_etag:
              result.sourceEtag || null,
            last_error: null,
            last_checked_at:
              new Date().toISOString(),
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict: "source_url",
          }
        );

      if (error) {
        throw new Error(error.message);
      }

      for (const updater of entry.updaters) {
        await updater(source);
      }
    }

    if (
      entry.rawValues.size > 1 ||
      [...entry.rawValues].some(
        (raw) => raw !== source
      )
    ) {
      generated += 1;
    } else {
      ready += 1;
    }

    console.log(
      `  ✓ display=${Math.round(
        (result.displayBytes || 0) / 1024
      )}KB thumb=${Math.round(
        (result.thumbBytes || 0) / 1024
      )}KB`
    );
  } catch (error) {
    failed += 1;

    console.error(
      "  ✗",
      error instanceof Error
        ? error.message
        : error
    );
  }
}

console.log("");
console.log("=== 결과 ===");
console.log(`정상/등록: ${ready}`);
console.log(`legacy marker 정리 대상: ${generated}`);
console.log(`실패: ${failed}`);

if (!applyMode) {
  console.log("");
  console.log(
    "실제 적용: npm run images:migrate-registry -- --apply"
  );
}
