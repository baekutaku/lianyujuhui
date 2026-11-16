import fs from "node:fs";

const file = "components/home/HomeMixedBody.tsx";

let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
src = src.replace(/\r\n/g, "\n");

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

const start = src.indexOf(
  "async function getLatestEventSection()"
);

if (start < 0) {
  fail("getLatestEventSection 함수를 찾지 못했습니다.");
}

const next = src.indexOf(
  "async function getCalendarEntries",
  start
);

if (next < 0) {
  fail("이벤트 함수 끝을 찾지 못했습니다.");
}

let block = src.slice(start, next);

/* 이벤트 쿼리에서 작성일 제거 */
block = block.replace(
  '.select("id, title, slug, subtype, release_year, start_date, thumbnail_url, created_at")',
  '.select("id, title, slug, subtype, release_year, start_date, thumbnail_url")'
);

/* 등록일 순서 → 실제 이벤트 날짜 순서 */
block = block.replace(
  `.order("created_at", { ascending: false })
    .limit(10);`,
  `.order("start_date", { ascending: false, nullsFirst: false })
    .order("release_year", { ascending: false })
    .order("title", { ascending: true })
    .limit(10);`
);

/* 홈 카드에 표시되는 날짜도 작성일 → 이벤트 시작일 */
block = block.replace(
  'meta: row.created_at?.slice(0, 10) ?? "",',
  'meta: row.start_date?.slice(0, 10) || (row.release_year ? String(row.release_year) : ""),'
);

if (block.includes('meta: row.created_at')) {
  fail("created_at 메타 치환에 실패했습니다.");
}

src =
  src.slice(0, start) +
  block +
  src.slice(next);

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("[OK] 홈 이벤트 날짜 수정");
console.log("- 표시: start_date");
console.log("- 정렬: start_date 최신순");
console.log("- start_date 없음: release_year 표시");
