import fs from "node:fs";

const file = "app/events/[slug]/page.tsx";

let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
src = src.replace(/\r\n/g, "\n");

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

/* =========================================================
   1. story-topbar section 찾기
   정확한 className 문자열을 가정하지 않음
========================================================= */

if (!src.includes("event-topbar-has-summary")) {
  const sectionRegex =
    /<section\s+className="([^"]*\bstory-topbar\b[^"]*)"\s*>/;

  const match = src.match(sectionRegex);

  if (!match) {
    fail("story-topbar가 들어간 section을 찾지 못했습니다.");
  }

  const originalClasses = match[1];

  const replacement = `<section
        className={\`${originalClasses} \${
          event.summary ? "event-topbar-has-summary" : ""
        }\`}
      >`;

  src = src.replace(sectionRegex, replacement);

  console.log(
    "[FOUND] story-topbar classes:",
    originalClasses
  );
}

/* =========================================================
   2. 오른쪽 빈 영역에 summary 추가
========================================================= */

if (!src.includes('className="event-topbar-summary"')) {
  const sideRegex =
    /<aside\s+className="story-topbar-side"\s*>/;

  const sideMatch = src.match(sideRegex);

  if (!sideMatch || sideMatch.index == null) {
    fail("story-topbar-side를 찾지 못했습니다.");
  }

  const summaryBlock = `{event.summary ? (
          <aside className="event-topbar-summary">
            <p className="event-topbar-summary-label">SUMMARY</p>
            <p className="event-topbar-summary-text">
              {event.summary}
            </p>
          </aside>
        ) : null}

        `;

  src =
    src.slice(0, sideMatch.index) +
    summaryBlock +
    src.slice(sideMatch.index);
}

/* =========================================================
   save
========================================================= */

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("");
console.log("[OK] EVENT DETAIL SUMMARY TOPBAR V2");
