import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const applyMode = process.argv.includes("--apply");
const PAGE_SIZE = 500;

function arg(name) {
  const prefix = `--${name}=`;
  const value = process.argv.find((item) => item.startsWith(prefix));
  return value ? value.slice(prefix.length).trim() : "";
}

function normalizeBase(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

const fromBase = normalizeBase(arg("from"));
const toBase = normalizeBase(arg("to"));

if (!/^https:\/\/.+/i.test(fromBase) || !/^https:\/\/.+/i.test(toBase)) {
  throw new Error(
    '사용법: npm run images:switch-domain -- --from=https://old.r2.dev --to=https://img.example.com [--apply]'
  );
}

if (fromBase === toBase) {
  throw new Error("--from과 --to가 같습니다.");
}

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

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  process.env.SUPABASE_URL?.trim();

const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수를 확인하세요."
  );
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function replaceBase(value) {
  const text = String(value || "");
  if (!text) return text;
  if (text === fromBase) return toBase;
  if (text.startsWith(fromBase + "/")) {
    return toBase + text.slice(fromBase.length);
  }
  return text;
}

function replaceBaseInText(value) {
  const text = String(value || "");
  if (!text.includes(fromBase)) return text;
  return text.split(fromBase).join(toBase);
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

async function verifyTargetDomain() {
  const { data, error } = await supabase
    .from("image_derivatives")
    .select("display_url, thumb_url, mirrored_original_url, source_url")
    .eq("status", "ready")
    .limit(100);

  if (error) {
    throw new Error(`registry 확인 실패: ${error.message}`);
  }

  let sample = "";

  for (const row of data ?? []) {
    for (const candidate of [
      row.thumb_url,
      row.display_url,
      row.mirrored_original_url,
      row.source_url,
    ]) {
      if (
        typeof candidate === "string" &&
        (candidate === fromBase || candidate.startsWith(fromBase + "/"))
      ) {
        sample = candidate;
        break;
      }
    }
    if (sample) break;
  }

  if (!sample) {
    console.warn(
      "경고: old domain 샘플을 registry에서 찾지 못해 HEAD 검증을 건너뜁니다."
    );
    return;
  }

  const target = replaceBase(sample);

  console.log(`도메인 연결 검증: ${target}`);

  let response;
  try {
    response = await fetch(target, {
      method: "HEAD",
      redirect: "follow",
    });
  } catch (error) {
    throw new Error(
      `새 custom domain에 접속할 수 없습니다: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  if (!response.ok) {
    throw new Error(
      `새 custom domain 검증 실패: HTTP ${response.status}\nCloudflare R2 Custom Domain이 Active인지 먼저 확인하세요.`
    );
  }

  console.log(`✓ custom domain 응답 정상 (HTTP ${response.status})`);
}

const targets = [
  {
    table: "cards",
    select: "id, thumbnail_url, cover_image_url",
    fields: ["thumbnail_url", "cover_image_url"],
  },
  {
    table: "card_images",
    select: "id, url",
    fields: ["url"],
  },
  {
    table: "illustrations",
    select: "id, image_url",
    fields: ["image_url"],
  },
  {
    table: "illustration_images",
    select: "id, url",
    fields: ["url"],
  },
  {
    table: "media_assets",
    select: "id, url, thumbnail_url",
    fields: ["url", "thumbnail_url"],
  },
  {
    table: "events",
    select: "id, thumbnail_url",
    fields: ["thumbnail_url"],
  },
  {
    table: "image_derivatives",
    select:
      "id, source_url, mirrored_original_url, display_url, thumb_url",
    fields: [
      "source_url",
      "mirrored_original_url",
      "display_url",
      "thumb_url",
    ],
  },
];

await verifyTargetDomain();

let matchedRows = 0;
let changedFields = 0;

for (const target of targets) {
  const rows = await fetchAll(target.table, target.select);

  for (const row of rows) {
    const patch = {};

    for (const field of target.fields) {
      const current = row[field];
      const next = replaceBase(current);

      if (next !== current) {
        patch[field] = next;
      }
    }

    const keys = Object.keys(patch);
    if (keys.length === 0) continue;

    matchedRows += 1;
    changedFields += keys.length;

    if (!applyMode) continue;

    const { error } = await supabase
      .from(target.table)
      .update(patch)
      .eq("id", row.id);

    if (error) {
      throw new Error(
        `${target.table} ${row.id} 업데이트 실패: ${error.message}`
      );
    }
  }
}

const translations = await fetchAll(
  "translations",
  "id, body, source_text"
);

let changedTranslationRows = 0;

for (const row of translations) {
  const patch = {};

  const nextBody = replaceBaseInText(row.body);
  const nextSourceText = replaceBaseInText(row.source_text);

  if (nextBody !== String(row.body || "")) patch.body = nextBody;
  if (nextSourceText !== String(row.source_text || "")) {
    patch.source_text = nextSourceText;
  }

  if (Object.keys(patch).length === 0) continue;

  changedTranslationRows += 1;

  if (!applyMode) continue;

  const { error } = await supabase
    .from("translations")
    .update(patch)
    .eq("id", row.id);

  if (error) {
    throw new Error(
      `translations ${row.id} 업데이트 실패: ${error.message}`
    );
  }
}

console.log("");
console.log("=== R2 public domain switch ===");
console.log(`mode: ${applyMode ? "APPLY" : "DRY RUN"}`);
console.log(`from: ${fromBase}`);
console.log(`to:   ${toBase}`);
console.log(`변경 row: ${matchedRows}`);
console.log(`변경 URL field: ${changedFields}`);
console.log(`변경 rich-text row: ${changedTranslationRows}`);

if (!applyMode) {
  console.log("");
  console.log("실제 적용하려면 같은 명령에 --apply 를 붙이세요.");
} else {
  const envPath = path.join(root, ".env.local");

  if (fs.existsSync(envPath)) {
    const backupPath =
      envPath + ".bak-r2-domain-switch-20261012";

    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(envPath, backupPath);
    }

    let envText = fs.readFileSync(envPath, "utf8");

    if (/^R2_PUBLIC_BASE_URL=.*$/m.test(envText)) {
      envText = envText.replace(
        /^R2_PUBLIC_BASE_URL=.*$/m,
        `R2_PUBLIC_BASE_URL=${toBase}`
      );
    } else {
      envText += `\nR2_PUBLIC_BASE_URL=${toBase}\n`;
    }

    if (/^NEXT_PUBLIC_R2_PUBLIC_BASE_URL=.*$/m.test(envText)) {
      envText = envText.replace(
        /^NEXT_PUBLIC_R2_PUBLIC_BASE_URL=.*$/m,
        `NEXT_PUBLIC_R2_PUBLIC_BASE_URL=${toBase}`
      );
    }

    fs.writeFileSync(envPath, envText, "utf8");
    console.log("");
    console.log("✓ .env.local R2_PUBLIC_BASE_URL 갱신");
  }

  console.log("");
  console.log(
    "중요: Vercel Production의 R2_PUBLIC_BASE_URL도 같은 custom domain으로 변경 후 재배포하세요."
  );
}
