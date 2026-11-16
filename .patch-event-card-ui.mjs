import fs from "node:fs";

const file = "app/stories/page.tsx";

let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
src = src.replace(/\r\n/g, "\n");

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = openIndex; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i++;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === "\\") {
        escaped = true;
        continue;
      }

      if (ch === quote) quote = null;

      continue;
    }

    if (ch === "/" && next === "/") {
      lineComment = true;
      i++;
      continue;
    }

    if (ch === "/" && next === "*") {
      blockComment = true;
      i++;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "{") depth++;

    if (ch === "}") {
      depth--;

      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

/* ---------------------------------------------------------
   import
--------------------------------------------------------- */

if (!src.includes('from "@/components/story/StoryArchiveViewToggle"')) {
  const firstImportEnd = src.indexOf("\n");

  if (firstImportEnd < 0) {
    fail("import 위치를 찾지 못했습니다.");
  }

  src =
    src.slice(0, firstImportEnd + 1) +
    'import StoryArchiveViewToggle from "@/components/story/StoryArchiveViewToggle";\n' +
    src.slice(firstImportEnd + 1);
}

/* ---------------------------------------------------------
   event branch
--------------------------------------------------------- */

const branchStart = src.indexOf(
  'if (activeTab.key === "event") {'
);

if (branchStart < 0) {
  fail("event 분기를 찾지 못했습니다.");
}

const openBrace = src.indexOf("{", branchStart);
const closeBrace = findMatchingBrace(src, openBrace);

if (closeBrace < 0) {
  fail("event 분기 끝을 찾지 못했습니다.");
}

let branch = src.slice(branchStart, closeBrace + 1);

/* 이벤트 카드임을 명확히 표시 */
if (
  !branch.includes(
    'className="story-archive-card-shell is-event"'
  )
) {
  branch = branch.replace(
    'className="story-archive-card-shell"',
    'className="story-archive-card-shell is-event"'
  );
}

/* ---------------------------------------------------------
   이벤트 요약 제거
--------------------------------------------------------- */

branch = branch.replace(
  /\n\s*\{event\.summary \? \(\s*\n\s*<p className="story-archive-summary">\{event\.summary\}<\/p>\s*\n\s*\) : null\}/,
  ""
);

/* 예전 "요약 없음" 버전도 제거 */
branch = branch.replace(
  /\n\s*\{event\.summary \? \(\s*[\s\S]*?<p className="story-archive-summary[^"]*">[\s\S]*?<\/p>\s*\) : \(\s*<p className="story-archive-summary[^"]*">[\s\S]*?<\/p>\s*\)\}/,
  ""
);

/* ---------------------------------------------------------
   크게 / 작게 토글
--------------------------------------------------------- */

if (!branch.includes("<StoryArchiveViewToggle")) {
  const countMarkers = [
    '<span className="meta-pill">{eventTotalCount}개</span>',
    '<span className="meta-pill">{events.length}개</span>',
  ];

  const marker = countMarkers.find((item) =>
    branch.includes(item)
  );

  if (!marker) {
    fail("이벤트 개수 표시 위치를 찾지 못했습니다.");
  }

  branch = branch.replace(
    marker,
    `<StoryArchiveViewToggle storageKey="story-archive-event-view" />
    ${marker}`
  );
}

/* ---------------------------------------------------------
   원문에 다시 반영
--------------------------------------------------------- */

src =
  src.slice(0, branchStart) +
  branch +
  src.slice(closeBrace + 1);

/* ---------------------------------------------------------
   collaboration_event 한글화
--------------------------------------------------------- */

if (!src.includes('subtype === "collaboration_event"')) {
  const fnStart = src.indexOf(
    "function getEventSubtypeLabel(subtype: string | null)"
  );

  if (fnStart < 0) {
    fail("getEventSubtypeLabel 함수를 찾지 못했습니다.");
  }

  const fnBrace = src.indexOf("{", fnStart);
  const fnEnd = findMatchingBrace(src, fnBrace);

  if (fnEnd < 0) {
    fail("getEventSubtypeLabel 끝을 찾지 못했습니다.");
  }

  let fn = src.slice(fnStart, fnEnd + 1);

  const nullLine = 'if (!subtype) return "이벤트";';

  if (!fn.includes(nullLine)) {
    fail("getEventSubtypeLabel 기준 줄을 찾지 못했습니다.");
  }

  fn = fn.replace(
    nullLine,
    `${nullLine}
  if (subtype === "collaboration_event" || subtype === "collab_event") return "콜라보";`
  );

  src =
    src.slice(0, fnStart) +
    fn +
    src.slice(fnEnd + 1);
}

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("[OK] app/stories/page.tsx");
