import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const applyMode = process.argv.includes("--apply");
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

    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  process.env.SUPABASE_URL?.trim();

const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const r2Base =
  process.env.R2_PUBLIC_BASE_URL?.trim()?.replace(/\/+$/, "") || "";

if (!url || !key) {
  throw new Error("Supabase 환경변수를 확인하세요.");
}

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function canonical(src) {
  const value = String(src || "")
    .trim()
    .replace(/&amp;/g, "&");

  if (!value) return "";

  try {
    const u = new URL(value);
    u.searchParams.delete("r2v");
    return u.toString();
  } catch {
    return value;
  }
}

const referenced = new Set();

function add(urlValue) {
  const source = canonical(urlValue);

  if (!/^https?:\/\//i.test(source)) return;

  if (
    r2Base &&
    (source === r2Base || source.startsWith(r2Base + "/"))
  ) {
    return;
  }

  referenced.add(source);
}

function addHtmlImageSources(html) {
  const text = String(html || "");

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

async function collectReferences() {
  const cards = await fetchAll(
    "cards",
    "thumbnail_url, cover_image_url"
  );
  for (const row of cards) {
    add(row.thumbnail_url);
    add(row.cover_image_url);
  }

  const cardImages = await fetchAll("card_images", "url");
  for (const row of cardImages) add(row.url);

  const illustrations = await fetchAll(
    "illustrations",
    "image_url"
  );
  for (const row of illustrations) add(row.image_url);

  const illustrationImages = await fetchAll(
    "illustration_images",
    "url"
  );
  for (const row of illustrationImages) add(row.url);

  const media = await fetchAll(
    "media_assets",
    "media_type, url, thumbnail_url"
  );
  for (const row of media) {
    if (row.media_type !== "image") continue;
    add(row.url);
    add(row.thumbnail_url);
  }

  const events = await fetchAll("events", "thumbnail_url");
  for (const row of events) add(row.thumbnail_url);

  const translations = await fetchAll(
    "translations",
    "body, source_text"
  );
  for (const row of translations) {
    addHtmlImageSources(row.body);
    addHtmlImageSources(row.source_text);
  }
}

async function fetchFailedRows() {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("image_derivatives")
      .select("id, source_url, status")
      .eq("status", "failed")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

await collectReferences();

const failedRows = await fetchFailedRows();

const stale = failedRows.filter(
  (row) => !referenced.has(canonical(row.source_url))
);

console.log("");
console.log(
  `${applyMode ? "APPLY" : "DRY RUN"}: stale failed registry rows ${stale.length}개`
);
console.log(
  "현재 이미지 필드 / <img src> / Markdown 이미지에서 더 이상 참조되지 않는 failed 행만 정리합니다."
);
console.log("");

for (const row of stale) {
  console.log(`- ${row.source_url}`);
}

if (!applyMode) {
  console.log("");
  console.log(
    "실제 삭제: npm run images:cleanup-registry -- --apply"
  );
  process.exit(0);
}

let deleted = 0;

for (const row of stale) {
  const { error } = await supabase
    .from("image_derivatives")
    .delete()
    .eq("id", row.id)
    .eq("status", "failed");

  if (error) {
    console.error(`✗ ${row.source_url}: ${error.message}`);
    continue;
  }

  deleted += 1;
}

console.log("");
console.log(`삭제 완료: ${deleted}`);
