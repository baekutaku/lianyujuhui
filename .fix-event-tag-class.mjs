import fs from "node:fs";

const file = "app/stories/page.tsx";

let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
src = src.replace(/\r\n/g, "\n");

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = openIndex; i < source.length; i++) {
    const ch = source[i];

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

const start = src.indexOf('if (activeTab.key === "event") {');

if (start < 0) {
  throw new Error("event 분기를 찾지 못했습니다.");
}

const open = src.indexOf("{", start);
const close = findMatchingBrace(src, open);

if (close < 0) {
  throw new Error("event 분기 끝을 찾지 못했습니다.");
}

let branch = src.slice(start, close + 1);

const before = branch;

branch = branch.replace(
  /className="story-inline-tag"/g,
  'className="story-card-tag"'
);

if (branch === before) {
  throw new Error("이벤트의 story-inline-tag를 찾지 못했습니다.");
}

src =
  src.slice(0, start) +
  branch +
  src.slice(close + 1);

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("[OK] event story-inline-tag -> story-card-tag");
