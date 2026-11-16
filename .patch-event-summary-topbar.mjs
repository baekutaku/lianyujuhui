import fs from "node:fs";

const file = "app/events/[slug]/page.tsx";

let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
src = src.replace(/\r\n/g, "\n");

/* ---------------------------------------------------------
   1. topbar에 summary 존재 클래스 추가
--------------------------------------------------------- */

const oldSection =
  '<section className="detail-panel story-topbar">';

const newSection = `<section
        className={\`detail-panel story-topbar \${
          event.summary ? "event-topbar-has-summary" : ""
        }\`}
      >`;

if (src.includes(oldSection)) {
  src = src.replace(oldSection, newSection);
} else if (!src.includes("event-topbar-has-summary")) {
  throw new Error("story-topbar section을 찾지 못했습니다.");
}

/* ---------------------------------------------------------
   2. 기존 숨겨진 story-topbar-side 앞에 summary 삽입
--------------------------------------------------------- */

const sideAnchor =
  '<aside className="story-topbar-side">';

if (!src.includes("event-topbar-summary")) {
  const sideIndex = src.indexOf(sideAnchor);

  if (sideIndex < 0) {
    throw new Error("story-topbar-side 위치를 찾지 못했습니다.");
  }

  const summaryBlock = `{event.summary ? (
          <aside className="event-topbar-summary">
            <p className="event-topbar-summary-label">SUMMARY</p>
            <p className="event-topbar-summary-text">{event.summary}</p>
          </aside>
        ) : null}

        `;

  src =
    src.slice(0, sideIndex) +
    summaryBlock +
    src.slice(sideIndex);
}

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("[OK] 이벤트 상세 상단 summary 삽입");
