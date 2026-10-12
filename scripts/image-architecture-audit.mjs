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

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  process.env.SUPABASE_URL?.trim();

const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  throw new Error("Supabase 환경변수를 확인하세요.");
}

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function fetchAllRegistryRows() {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("image_derivatives")
      .select(
        "source_kind, status, source_url, last_error, updated_at"
      )
      .order("updated_at", {
        ascending: false,
      })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

const rows = await fetchAllRegistryRows();

const counts = {};

for (const row of rows) {
  const group = `${row.source_kind}:${row.status}`;
  counts[group] = (counts[group] || 0) + 1;
}

console.log("=== image_derivatives ===");
console.log(`total                    ${rows.length}`);

for (const [group, count] of Object.entries(counts)) {
  console.log(`${group.padEnd(24)} ${count}`);
}

const failed = rows.filter(
  (row) => row.status === "failed"
);

if (failed.length > 0) {
  console.log("");
  console.log(`=== failed (${failed.length}) ===`);

  for (const row of failed) {
    console.log(`- ${row.source_url}`);

    if (row.last_error) {
      console.log(`  ${row.last_error}`);
    }
  }
}
