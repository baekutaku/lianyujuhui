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
  if (openIndex < 0 || source[openIndex] !== "{") return -1;

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
      if (depth === 0) return i;
    }
  }

  return -1;
}

/* -------------------------------------------------
   import
------------------------------------------------- */

if (!src.includes(
  'from "@/components/story/StoryArchiveViewToggle"'
)) {
  const importMatches = [
    ...src.matchAll(/^import .+;$/gm)
  ];

  if (importMatches.length === 0) {
    fail("import 영역을 찾지 못했습니다.");
  }

  const last = importMatches[importMatches.length - 1];
  const insertAt = last.index + last[0].length;

  src =
    src.slice(0, insertAt) +
    '\nimport StoryArchiveViewToggle from "@/components/story/StoryArchiveViewToggle";' +
    src.slice(insertAt);
}

/* -------------------------------------------------
   EVENT branch
------------------------------------------------- */

const branchStart = src.indexOf(
  'if (activeTab.key === "event") {'
);

if (branchStart < 0) {
  fail("event 분기를 찾지 못했습니다.");
}

const branchOpen = src.indexOf("{", branchStart);
const branchClose = findMatchingBrace(src, branchOpen);

if (branchClose < 0) {
  fail("event 분기 끝을 찾지 못했습니다.");
}

let branch = src.slice(branchStart, branchClose + 1);

/* -------------------------------------------------
   event card class
------------------------------------------------- */

branch = branch.replace(
  /className="story-archive-card-shell"(?!\s+is-event)/,
  'className="story-archive-card-shell is-event"'
);

/* -------------------------------------------------
   summary 제거
------------------------------------------------- */

branch = branch.replace(
  /\s*\{event\.summary\s*\?\s*\(\s*<p\s+className="story-archive-summary">\{event\.summary\}<\/p>\s*\)\s*:\s*null\}/g,
  ""
);

branch = branch.replace(
  /\s*\{event\.summary\s*\?\s*\([\s\S]*?<p\s+className="story-archive-summary[^"]*">[\s\S]*?<\/p>[\s\S]*?\)\s*:\s*\([\s\S]*?<p\s+className="story-archive-summary[^"]*">[\s\S]*?<\/p>[\s\S]*?\)\}/g,
  ""
);

/* -------------------------------------------------
   크게 / 작게
   event intro 영역 안의 "...개" meta-pill을 찾아 앞에 삽입
------------------------------------------------- */

if (!branch.includes("<StoryArchiveViewToggle")) {
  const introStart = branch.indexOf(
    'className="detail-panel story-archive-intro"'
  );

  if (introStart < 0) {
    fail("이벤트 현재 카테고리 영역을 찾지 못했습니다.");
  }

  const introEnd = branch.indexOf("</section>", introStart);

  if (introEnd < 0) {
    fail("이벤트 현재 카테고리 영역 끝을 찾지 못했습니다.");
  }

  const intro = branch.slice(introStart, introEnd);

  const countRe =
    /<span\s+className="meta-pill">\s*\{[^}]+\}\s*개\s*<\/span>/s;

  const countMatch = intro.match(countRe);

  if (!countMatch) {
    fail("이벤트 개수 배지를 찾지 못했습니다.");
  }

  const introPatched = intro.replace(
    countRe,
    `<StoryArchiveViewToggle storageKey="story-archive-event-view" />
${countMatch[0]}`
  );

  branch =
    branch.slice(0, introStart) +
    introPatched +
    branch.slice(introEnd);
}

/* -------------------------------------------------
   branch 반영
------------------------------------------------- */

src =
  src.slice(0, branchStart) +
  branch +
  src.slice(branchClose + 1);

/* -------------------------------------------------
   subtype 표시명
------------------------------------------------- */

const fnStart = src.indexOf(
  "function getEventSubtypeLabel(subtype: string | null)"
);

if (fnStart < 0) {
  fail("getEventSubtypeLabel을 찾지 못했습니다.");
}

const fnOpen = src.indexOf("{", fnStart);
const fnClose = findMatchingBrace(src, fnOpen);

if (fnClose < 0) {
  fail("getEventSubtypeLabel 끝을 찾지 못했습니다.");
}

let fn = src.slice(fnStart, fnClose + 1);

if (!fn.includes('subtype === "collaboration_event"')) {
  const anchor = 'if (!subtype) return "이벤트";';

  if (!fn.includes(anchor)) {
    fail("getEventSubtypeLabel 기준 줄을 찾지 못했습니다.");
  }

  fn = fn.replace(
    anchor,
    `${anchor}
  if (
    subtype === "collaboration_event" ||
    subtype === "collab_event"
  ) return "콜라보";`
  );

  src =
    src.slice(0, fnStart) +
    fn +
    src.slice(fnClose + 1);
}

/* -------------------------------------------------
   save
------------------------------------------------- */

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("");
console.log("[OK] EVENT CARD UI V2");
console.log("- 크게 / 작게");
console.log("- 이벤트 summary 제거");
console.log("- is-event class");
console.log("- collaboration_event => 콜라보");
