import fs from "node:fs";

const file = "app/events/[slug]/page.tsx";

let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
src = src.replace(/\r\n/g, "\n");

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

/* ---------------------------------------------------------
   1. 현재 바깥에 있는 summary 블록 제거
--------------------------------------------------------- */

const summaryRegex =
  /\s*\{event\.summary\s*\?\s*\(\s*<aside className="event-topbar-summary">[\s\S]*?<\/aside>\s*\)\s*:\s*null\}/;

if (!summaryRegex.test(src)) {
  fail("현재 event-topbar-summary 블록을 찾지 못했습니다.");
}

src = src.replace(summaryRegex, "");

/* ---------------------------------------------------------
   2. story-topbar section 찾기
--------------------------------------------------------- */

const topbarMatch = src.match(
  /<section[\s\S]*?className=\{`[^`]*story-topbar[^`]*`\}[\s\S]*?>/
);

let topbarStart = topbarMatch?.index ?? -1;

/* className="..." 형태도 지원 */
if (topbarStart < 0) {
  const simpleMatch = src.match(
    /<section[^>]*className="[^"]*\bstory-topbar\b[^"]*"[^>]*>/
  );

  topbarStart = simpleMatch?.index ?? -1;
}

if (topbarStart < 0) {
  fail("story-topbar section 시작을 찾지 못했습니다.");
}

/* 이 topbar 안에는 중첩 section이 없으므로 첫 </section>이 종료점 */
const topbarClose = src.indexOf("</section>", topbarStart);

if (topbarClose < 0) {
  fail("story-topbar 닫는 section을 찾지 못했습니다.");
}

/* ---------------------------------------------------------
   3. 흰 카드 내부 오른쪽 칸으로 삽입
--------------------------------------------------------- */

const summaryBlock = `

        {event.summary ? (
          <aside className="event-topbar-summary">
            <p className="event-topbar-summary-label">SUMMARY</p>
            <p className="event-topbar-summary-text">
              {event.summary}
            </p>
          </aside>
        ) : null}
`;

src =
  src.slice(0, topbarClose) +
  summaryBlock +
  src.slice(topbarClose);

/* ---------------------------------------------------------
   저장
--------------------------------------------------------- */

if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("[OK] summary를 story-topbar 내부로 이동");
