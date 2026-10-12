import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
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

async function fetchAll(table, columns) {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.warn(
        `[skip] ${table}: ${error.message}`
      );
      return rows;
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

async function fetchFailedSources() {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("image_derivatives")
      .select("source_url, last_error")
      .eq("status", "failed")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) break;
  }

  return rows.map((row) => ({
    source_url: canonical(row.source_url),
    last_error: row.last_error || "",
  }));
}

function addReference(map, source, reference) {
  const clean = canonical(source);
  if (!clean || !map.has(clean)) return;

  map.get(clean).references.push(reference);
}

function containsSource(text, source) {
  const value = String(text || "");
  if (!value) return false;

  return (
    value.includes(source) ||
    value.includes(source.replace(/&/g, "&amp;"))
  );
}

const failedRows = await fetchFailedSources();

const resultMap = new Map(
  failedRows.map((row) => [
    row.source_url,
    {
      source_url: row.source_url,
      last_error: row.last_error,
      references: [],
    },
  ])
);

const [
  cards,
  cardImages,
  illustrations,
  illustrationImages,
  mediaAssets,
  events,
  translations,
] = await Promise.all([
  fetchAll(
    "cards",
    "id, slug, title, thumbnail_url, cover_image_url"
  ),
  fetchAll(
    "card_images",
    "id, card_id, url, is_detail_before, is_detail_after, is_list_default, is_list_hover"
  ),
  fetchAll(
    "illustrations",
    "id, title, image_url"
  ),
  fetchAll(
    "illustration_images",
    "id, illustration_id, url, is_primary, sort_order"
  ),
  fetchAll(
    "media_assets",
    "id, parent_type, parent_id, media_type, usage_type, title, url, thumbnail_url"
  ),
  fetchAll(
    "events",
    "id, slug, title, thumbnail_url"
  ),
  fetchAll(
    "translations",
    "id, title, slug, body, source_text"
  ),
]);

for (const row of cards) {
  addReference(
    resultMap,
    row.thumbnail_url,
    {
      table: "cards",
      id: row.id,
      field: "thumbnail_url",
      label: row.title || row.slug || row.id,
      route: row.slug ? `/cards/${row.slug}` : null,
    }
  );

  addReference(
    resultMap,
    row.cover_image_url,
    {
      table: "cards",
      id: row.id,
      field: "cover_image_url",
      label: row.title || row.slug || row.id,
      route: row.slug ? `/cards/${row.slug}` : null,
    }
  );
}

for (const row of cardImages) {
  addReference(
    resultMap,
    row.url,
    {
      table: "card_images",
      id: row.id,
      field: "url",
      label: `card_id=${row.card_id}`,
      meta: {
        is_detail_before: row.is_detail_before,
        is_detail_after: row.is_detail_after,
        is_list_default: row.is_list_default,
        is_list_hover: row.is_list_hover,
      },
    }
  );
}

for (const row of illustrations) {
  addReference(
    resultMap,
    row.image_url,
    {
      table: "illustrations",
      id: row.id,
      field: "image_url",
      label: row.title || row.id,
      route: `/illustrations/${row.id}`,
    }
  );
}

for (const row of illustrationImages) {
  addReference(
    resultMap,
    row.url,
    {
      table: "illustration_images",
      id: row.id,
      field: "url",
      label: `illustration_id=${row.illustration_id}`,
      route: row.illustration_id
        ? `/illustrations/${row.illustration_id}`
        : null,
      meta: {
        is_primary: row.is_primary,
        sort_order: row.sort_order,
      },
    }
  );
}

for (const row of mediaAssets) {
  if (row.media_type && row.media_type !== "image") {
    continue;
  }

  addReference(
    resultMap,
    row.url,
    {
      table: "media_assets",
      id: row.id,
      field: "url",
      label: `${row.parent_type || "?"}:${row.parent_id || "?"}`,
      meta: {
        usage_type: row.usage_type,
        title: row.title,
      },
    }
  );

  addReference(
    resultMap,
    row.thumbnail_url,
    {
      table: "media_assets",
      id: row.id,
      field: "thumbnail_url",
      label: `${row.parent_type || "?"}:${row.parent_id || "?"}`,
      meta: {
        usage_type: row.usage_type,
        title: row.title,
      },
    }
  );
}

for (const row of events) {
  addReference(
    resultMap,
    row.thumbnail_url,
    {
      table: "events",
      id: row.id,
      field: "thumbnail_url",
      label: row.title || row.slug || row.id,
      route: row.slug ? `/events/${row.slug}` : null,
    }
  );
}

for (const row of translations) {
  for (const failed of failedRows) {
    if (containsSource(row.body, failed.source_url)) {
      resultMap.get(failed.source_url).references.push({
        table: "translations",
        id: row.id,
        field: "body",
        label: row.title || row.slug || row.id,
        route: row.id
          ? `/admin/translations/${row.id}/edit`
          : null,
      });
    }

    if (
      containsSource(
        row.source_text,
        failed.source_url
      )
    ) {
      resultMap.get(failed.source_url).references.push({
        table: "translations",
        id: row.id,
        field: "source_text",
        label: row.title || row.slug || row.id,
        route: row.id
          ? `/admin/translations/${row.id}/edit`
          : null,
      });
    }
  }
}

const results = [...resultMap.values()];

const orphaned = results.filter(
  (item) => item.references.length === 0
);

const referenced = results.filter(
  (item) => item.references.length > 0
);

console.log("");
console.log("=== failed image reference trace ===");
console.log(`failed registry: ${results.length}`);
console.log(`실제 참조 있음: ${referenced.length}`);
console.log(`현재 참조 없음: ${orphaned.length}`);
console.log("");

for (let index = 0; index < referenced.length; index += 1) {
  const item = referenced[index];

  console.log(
    `[${index + 1}/${referenced.length}] ${item.source_url}`
  );

  for (const ref of item.references) {
    console.log(
      `  - ${ref.table}.${ref.field} | ${ref.label}`
    );

    if (ref.route) {
      console.log(`    route: ${ref.route}`);
    }

    if (ref.meta) {
      console.log(
        `    meta: ${JSON.stringify(ref.meta)}`
      );
    }
  }

  console.log("");
}

if (orphaned.length > 0) {
  console.log("=== orphaned failed registry ===");

  for (const item of orphaned) {
    console.log(`- ${item.source_url}`);
  }

  console.log("");
}

const report = {
  generated_at: new Date().toISOString(),
  summary: {
    failed_registry: results.length,
    referenced: referenced.length,
    orphaned: orphaned.length,
  },
  items: results,
};

const reportPath = path.join(
  root,
  "image-failed-reference-report.json"
);

fs.writeFileSync(
  reportPath,
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

console.log(`JSON report: ${reportPath}`);
