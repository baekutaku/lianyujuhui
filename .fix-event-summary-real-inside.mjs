import fs from "node:fs";

const file = "app/events/[slug]/page.tsx";

let src = fs.readFileSync(file, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
src = src.replace(/\r\n/g, "\n");

function fail(message) {
  console.error("[ERROR]", message);
  process.exit(1);
}

/* 1. 잘못 들어간 summary 블록 전부 제거 */
src = src.replace(
  /\s*\{event\.summary\s*\?\s*\(\s*<aside className="event-topbar-summary">[\s\S]*?<\/aside>\s*\)\s*:\s*null\}/g,
  ""
);

/* 2. 실제 흰 카드 시작 위치 */
const panelMarker =
  '<section className="detail-panel story-topbar-main-panel">';

const panelStart = src.indexOf(panelMarker);

if (panelStart < 0) {
  fail("story-topbar-main-panel을 찾지 못했습니다.");
}

/* 3. 이 패널의 종료 위치:
      실제 코드 구조상 바로 뒤에 hasConnections가 시작됨 */
const closeMarker =
  '\n        </section>\n\n        {hasConnections ? (';

const panelClose = src.indexOf(closeMarker, panelStart);

if (panelClose < 0) {
  fail("story-topbar-main-panel 종료 위치를 찾지 못했습니다.");
}

/* 4. 흰 카드 내부 마지막에 summary 삽입 */
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
  src.slice(0, panelClose) +
  summaryBlock +
  src.slice(panelClose);

/* 저장 */
if (eol === "\r\n") {
  src = src.replace(/\n/g, "\r\n");
}

fs.writeFileSync(file, src, "utf8");

console.log("[OK] summary를 실제 흰 topbar 카드 내부로 이동");
